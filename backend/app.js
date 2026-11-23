import express from "express";
import {DatabaseSync} from "node:sqlite";
import {fileURLToPath} from "node:url";
import {makePrereqParser} from "./prereqParser.js";

const path = fileURLToPath(new URL("./uci_courses.db", import.meta.url));
const db = new DatabaseSync(path, {readOnly: true});
const app = express();

// Get the real department from a department alias
const aliasStmt = db.prepare(`
    SELECT department
    FROM department_aliases
    WHERE alias = ? 
`);

// Course number search alone, goes across every department for a course with a matching number
const numberStmt = db.prepare(`
    SELECT id, department, course_number, title, min_units, max_units
    FROM courses
    WHERE course_number LIKE ?
    ORDER BY (course_number = ?) DESC, department, course_number
    LIMIT 25
`);

// Get course information matching the department and number
const departmentNumberStmt = db.prepare(`
    SELECT id, department, course_number, title, min_units, max_units
    FROM courses
    WHERE department = ? AND course_number LIKE ?
    ORDER BY (course_number = ?) DESC, course_number
    LIMIT 10
`);

// FTS over title, description, and department name, scored by relevance, weighting given to table columns
const ftsStmt = db.prepare(`
    SELECT c.id, c.department, c.course_number, c.title, c.min_units, c.max_units
    FROM courses_fts
    JOIN courses c ON c.id = courses_fts.course_id
    WHERE courses_fts MATCH ?
    ORDER BY bm25(courses_fts, 0, 5, 1, 2)
    LIMIT 20
`);

const courseStmt = db.prepare("SELECT * FROM courses WHERE id = ?");

const courseLabelStmt = db.prepare("SELECT id, department, course_number, title FROM courses WHERE id = ?");

const {parse: parsePrereqText, hasCourseCode} = makePrereqParser(
    db.prepare("SELECT DISTINCT department FROM courses").all().map((row) => row.department)
);

// Records that hold broken data, hidden from search
// "Professional)MNGE201" style rows are bad copies of the real MNGE courses
// ANTHRO125P holds Mechanical Engineering Design I's title and text with someone else's prerequisites
const BROKEN_RECORDS = new Set(["ANTHRO125P"]);
function isBrokenRecord(course) {
    return BROKEN_RECORDS.has(course.id) || course.department.includes(")");
}

// Course ids a prerequisite tree requires, "can't have taken" (NOT) groups are skipped
// "I&C SCI 46" becomes "I&CSCI46", the same as the courses table id
function requiredCourseIds(tree, ids = new Set()) {
    if (!tree || typeof tree !== "object" || tree.NOT) {
        return ids;
    }
    if (tree.prereqType === "course") {
        ids.add(tree.courseId.replace(/\s+/g, ""));
    }
    for (const child of [...(tree.AND ?? []), ...(tree.OR ?? [])]) {
        requiredCourseIds(child, ids);
    }
    return ids;
}

// The prerequisite tree to use for a course, and where it came from
// prereq_edges and an empty prerequisite_tree can't be trusted (AnteaterAPI's parser gave up on ~1,300 courses),
// so when the tree has no courses but the catalogue text does, we read the text ourselves
//   "catalogue"    AnteaterAPI's tree
//   "parsed"       our reading of the catalogue text
//   "recommended"  the text only recommends courses, nothing is required
//   "unparsed"     the text lists courses but is too complex for us, show the text instead
function readPrerequisites(row) {
    const apiTree = JSON.parse(row.prerequisite_tree || "{}");
    const text = row.prerequisite_text ?? "";
    if (requiredCourseIds(apiTree).size > 0 || !hasCourseCode(text)) {
        return {tree: apiTree, source: "catalogue"};
    }
    const parsed = parsePrereqText(text);
    if (parsed) {
        // Keep any "can't have taken" groups AnteaterAPI did find
        const exclusions = (apiTree.AND ?? []).filter((item) => item.NOT);
        return {tree: {AND: [...parsed.AND, ...exclusions]}, source: "parsed"};
    }
    return {tree: apiTree, source: /^recommended/i.test(text.trim()) ? "recommended" : "unparsed"};
}


app.get("/api/search", (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (!q) {
        return res.json([]);
    }
    const results = new Map();
    function addResults(rows) {
        for (const course of rows) {
            if (!results.has(course.id) && !isBrokenRecord(course)) {
                results.set(course.id, course);
            }
        }
    }

    // Course becomes department letters and digits only, all uppercase
    // Try splitting the search between department and digit and look up department alias
    const key = q.replace(/[^a-z0-9]/gi, "").toUpperCase();
    const numberOnly = /^\d+[A-Z]{0,2}$/.test(key);
    if (numberOnly) {
        addResults(numberStmt.all(`${key}%`, key));
    }
    for (let i = 1; i < key.length; i++) {
        if (!/\d/.test(key[i])) {
            continue;
        }
        const alias = key.slice(0, i);
        const number = key.slice(i);
        for (const {department} of aliasStmt.all(alias)) {
            addResults(departmentNumberStmt.all(department, `${number}%`, number));
        }
    }

    // Search for anything matching course department, id, description
    const terms = q.match(/[a-z0-9]+/gi) ?? [];
    if (terms.length) {
        const ftsQuery = terms.map(term => `"${term}"*`).join(" AND ");
        try {
            addResults(ftsStmt.all(ftsQuery));
        } catch (err) {
            console.warn("FTS search failed:", err.message);
        }
    }

    res.json([...results.values()].slice(0, 10));
});

// Get course information given an id
app.get("/api/course/*id", (req, res) => {
    const id = [].concat(req.params.id).join("/");
    const c = courseStmt.get(id);
    if (!c) {
        return res.status(404).json({error: "course not found"});
    }
    const {tree, source} = readPrerequisites(c);
    res.json({
        id: c.id,
        department: c.department,
        department_name: c.department_name,
        course_number: c.course_number,
        title: c.title,
        description: c.description,
        min_units: c.min_units,
        max_units: c.max_units,
        prerequisite_text: c.prerequisite_text,
        prerequisite_tree: tree,
        prerequisite_source: source,
        // Flat list of the courses in the tree that exist in our data, used when the tree can't be drawn
        prerequisites: [...requiredCourseIds(tree)].map((prereqId) => courseLabelStmt.get(prereqId)).filter(Boolean),
    });
});

// Get every prerequisite of a course, all the way down, as a list of courses and edges
// Walks the prerequisite trees (not prereq_edges, which is missing ~770 of the trees' courses)
app.get("/api/course-tree/*id", (req, res) => {
    const id = [].concat(req.params.id).join("/");
    if (!courseStmt.get(id)) {
        return res.status(404).json({error: "course not found"});
    }
    const courses = [];
    const edges = [];
    const seen = new Set([id]);
    const queue = [id];
    while (queue.length > 0) {
        const row = courseStmt.get(queue.shift());
        const {tree, source} = readPrerequisites(row);
        courses.push({
            id: row.id,
            department: row.department,
            course_number: row.course_number,
            title: row.title,
            prerequisite_tree: tree,
            prerequisite_source: source,
        });
        for (const prereqId of requiredCourseIds(tree)) {
            // Courses missing from our data are still drawn from the tree, they just have nothing to walk into
            if (!courseLabelStmt.get(prereqId)) {
                continue;
            }
            edges.push({course_id: row.id, prereq_id: prereqId});
            if (!seen.has(prereqId)) {
                seen.add(prereqId);
                queue.push(prereqId);
            }
        }
    }
    res.json({id, courses, edges});
});

export default app;
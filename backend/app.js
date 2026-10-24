import express from "express";
import {DatabaseSync} from "node:sqlite";
import {fileURLToPath} from "node:url";

const path = fileURLToPath(new URL("./uci_courses.db", import.meta.url));
const db = new DatabaseSync(path);
const app = express();

const aliasStmt = db.prepare(`
    SELECT department
    FROM department_aliases
    WHERE alias = ? 
`);

const departmentNumberStmt = db.prepare(`
    SELECT id, department, course_number, title
    FROM courses
    WHERE department = ? AND course_number LIKE ?
    ORDER BY (course_number = ?) DESC, course_number
    LIMIT 10
`);

const ftsStmt = db.prepare(`
    SELECT c.id, c.department, c.course_number, c.title
    FROM courses_fts
    JOIN courses c ON c.id = courses_fts.course_id
    WHERE courses_fts MATCH ?
    ORDER BY bm25(courses_fts, 0, 5, 1, 2)
    LIMIT 20
`);

const courseStmt = db.prepare("SELECT * FROM courses WHERE id = ?");
const prereqStmt = db.prepare(`
    SELECT p.id, p.department, p.course_number, p.title
    FROM prereq_edges e JOIN courses p ON p.id = e.prereq_id
    WHERE e.course_id = ?
`);

const prereqEdges = db.prepare(`
    WITH RECURSIVE chain(course_id, prereq_id) AS (
      SELECT course_id, prereq_id FROM prereq_edges WHERE course_id = ?
      UNION
      SELECT e.course_id, e.prereq_id
      FROM prereq_edges e
      JOIN chain ON e.course_id = chain.prereq_id
    )
    SELECT course_id, prereq_id FROM chain
  `);
  

app.get("/api/search", (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (!q) {
        return res.json([]);
    }
    const results = new Map();
    function addResults(rows) {
        for (const course of rows) {
            if (!results.has(course.id)) {
                results.set(course.id, course);
            }
        }
    }

    const key = q.replace(/[^a-z0-9]/gi, "").toUpperCase();
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

app.get("/api/course/*id", (req, res) => {
    const id = [].concat(req.params.id).join("/");
    const c = courseStmt.get(id);
    if (!c) {
        return res.status(404).json({error: "course not found"});
    }
    res.json({
        id: c.id,
        department: c.department,
        department_name: c.department_name,
        course_number: c.course_number,
        title: c.title,
        description: c.description,
        prerequisite_text: c.prerequisite_text,
        prerequisite_tree: JSON.parse(c.prerequisite_tree || "{}"),
        prerequisites: prereqStmt.all(id),
    });
});


/** 
const codeSearch = db.prepare(`
    SELECT DISTINCT c.id, c.department, c.course_number, c.title, c.min_units
    FROM courses c
    LEFT JOIN department_aliases a ON a.department = c.department
    WHERE REPLACE(UPPER(c.department || c.course_number), ' ', '') LIKE ?
       OR REPLACE(UPPER(a.alias || c.course_number), ' ', '') LIKE ?
    LIMIT 20
  `);

*/
  

export default app;
// DATA AND COURSES FROM ANTEATER API: https://docs.icssc.club/docs/about/anteaterapi

import {DatabaseSync} from "node:sqlite";

const API = "https://anteaterapi.com/v2/rest";
const API_KEY = process.env.ANTEATER_API_KEY;
const PAGE_SIZE = 100;
const NOT_ACRONYM = new Set(["and", "of", "the", "in"]);

async function getData(url) {
    const headers = API_KEY ? {Authorization: `Bearer ${API_KEY}`} : {};
    const res = await fetch(url, {headers});
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
    }
    const body = await res.json();
    return body.data;
}

async function fetchAllCourses() {
    let byId = new Map();
    let skip = 0;
    let lastFirstId = null;

    while (true) {
        const batch = await getData(`${API}/courses?take=${PAGE_SIZE}&skip=${skip}`);
        if (!batch.length || batch[0].id === lastFirstId) {
            break;
        }
        lastFirstId = batch[0].id;
        for (const c of batch) {
            byId.set(c.id, c);
        }
        skip += batch.length;
        console.log(`fetched ${byId.size} courses...`);
        await new Promise((r) => setTimeout(r, 200));
    }
    return byId;
}

async function backfillMissing(byId) {
    const missing = new Set();
    for (const c of byId.values()) {
        for (const p of c.prerequisites ?? []) {
            if (!byId.has(p.id)) {
                missing.add(p.id);
            }
        }
    }
    if (missing.size) {
        console.log(`Backfilling ${missing.size} courses not in bulk data...`);
    }
    for (const id of missing) {
        try {
            const c = await getData(`${API}/courses/${encodeURIComponent(id)}`);
            byId.set(c.id, c);
        } catch (err) {
            console.warn(`Could not backfill ${id}: ${err.message}`);
        }
    }
}

function normalizeAlias(value) {
    return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function aliasesFor(code, name) {
    const aliases = new Set();
    const normalizedCode = normalizeAlias(code);
    if (normalizedCode) {
        aliases.add(normalizedCode);
    }

    const words = name.split(/[\s,&/()-]+/).filter(word =>
        word && !NOT_ACRONYM.has(word.toLowerCase())
    );
    const acronym = words.map(word => word[0]).join("").toUpperCase();
    if (acronym) {
        aliases.add(acronym);
    }

    for (const word of words) {
        for (let n = 3; n <= Math.min(word.length, 5); n++) {
            aliases.add(word.slice(0, n).toUpperCase());
        }
    }
    return [...aliases].filter(alias => alias.length >= 2);
}

function buildDatabase(byId) {
    const db = new DatabaseSync("uci_courses.db");
    db.exec(`
        DROP TABLE IF EXISTS prereq_edges;
        DROP TABLE IF EXISTS courses;
        DROP TABLE IF EXISTS courses_fts;
        DROP TABLE IF EXISTS department_aliases;

        CREATE TABLE courses (
            id TEXT PRIMARY KEY,
            department TEXT,
            department_name TEXT,
            course_number TEXT,
            title TEXT,
            description TEXT,
            min_units REAL,
            max_units REAL,
            prerequisite_text TEXT,
            prerequisite_tree TEXT
        );

        CREATE VIRTUAL TABLE courses_fts USING fts5(
            course_id UNINDEXED,
            title,
            description,
            department_name,
            tokenize = 'porter unicode61'
        );

        CREATE TABLE prereq_edges (
            course_id TEXT,
            prereq_id TEXT,
            PRIMARY KEY (course_id, prereq_id)
        );

        CREATE TABLE department_aliases (
            alias TEXT NOT NULL,
            department TEXT NOT NULL,
            PRIMARY KEY (alias, department)
        );

        CREATE INDEX idx_courses_id ON courses(id);
        CREATE INDEX idx_aliases_lookup ON department_aliases(alias);
    `);

    const insertCourse = db.prepare("INSERT OR REPLACE INTO courses VALUES (?,?,?,?,?,?,?,?,?,?)");
    const insertEdge = db.prepare("INSERT OR IGNORE INTO prereq_edges VALUES (?,?)");
    const insertFts = db.prepare(`INSERT INTO courses_fts (course_id, title, description, department_name) VALUES (?, ?, ?, ?)`);
    const insertAlias = db.prepare(`INSERT OR IGNORE INTO department_aliases (alias, department) VALUES (?, ?)`);

    const departments = new Map();
    db.exec("BEGIN");
    for (const c of byId.values()) {
        insertCourse.run(
            c.id,
            c.department,
            c.departmentName,
            c.courseNumber,
            c.title,
            c.description ?? "",
            c.minUnits ?? null,
            c.maxUnits ?? null,
            c.prerequisiteText ?? "",
            JSON.stringify(c.prerequisiteTree ?? {})
        );
        insertFts.run(
            c.id,
            c.title ?? "",
            c.description ?? "",
            c.departmentName ?? ""
        );
        for (const p of c.prerequisites ?? []) {
            insertEdge.run(c.id, p.id);
        }
        if (c.department) {
            departments.set(c.department, c.departmentName ?? "");
        }
    }

    for (const [code, name] of departments) {
        for (const alias of aliasesFor(code, name)) {
            insertAlias.run(alias, code);
        }
    }
    db.exec("COMMIT");

    const num = db.prepare("SELECT COUNT(*) AS n FROM courses").get().n;
    const edges = db.prepare("SELECT COUNT(*) AS n FROM prereq_edges").get().n;
    const aliases = db.prepare("SELECT COUNT(*) AS n FROM department_aliases").get().n;
    db.close();
    console.log(`Done: ${num} courses, ${edges} prerequisite links, ${departments.size} departments, ${aliases} aliases -> uci_courses.db`);
}

if (!API_KEY) {
    console.log("No ANTEATER_API_KEY found, running without a key (lower rate limits).");
}
const courses = await fetchAllCourses();
await backfillMissing(courses);
buildDatabase(courses);
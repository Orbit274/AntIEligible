import app from "./app.js";

import express from "express";
import { DatabaseSync } from "node:sqlite";


const db = new DatabaseSync("uci_courses.db", { readOnly: true });
const app = express();


const codeSearch = db.prepare(`
    SELECT DISTINCT c.id, c.department, c.course_number, c.title, c.min_units
    FROM courses c
    LEFT JOIN department_aliases a ON a.department = c.department
    WHERE REPLACE(UPPER(c.department || c.course_number), ' ', '') LIKE ?
       OR REPLACE(UPPER(a.alias || c.course_number), ' ', '') LIKE ?
    LIMIT 20
  `);





app.listen(3000, () => {
    console.log("Backend running at http://localhost:3000");
});

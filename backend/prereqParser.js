// Our own reader for catalogue prerequisite text, used when AnteaterAPI's prerequisite_tree came back empty
// It only handles the simple shapes most of those texts use:
//   "A", "A and B", "A or B or C", "(A and B) or (A and C)", "A with a minimum grade of C", "A (may be taken concurrently)"
// and sentences joined by periods, which all have to be met
// Anything else gives null, so the caller can show the raw text instead of guessing

const GRADE = "([A-F][+-]?|Pass)";
const NUMBER = "[A-Z]*\\d+[A-Z0-9]*";

// Builds a reader for the given department names ("I&C SCI", "COMPSCI", "CRM/LAW", ...)
export function makePrereqParser(departments) {
    // Longest first so "I&C SCI" wins over a shorter department that is a prefix of it
    const escaped = [...departments]
        .sort((a, b) => b.length - a.length)
        .map((department) => department.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const courseRe = new RegExp(`^(${escaped.join("|")}) (${NUMBER})\\b`);
    const anyCourseRe = new RegExp(`(?:^|[^A-Za-z])(${escaped.join("|")}) ${NUMBER}\\b`);

    function hasCourseCode(text) {
        return anyCourseRe.test(text ?? "");
    }

    // Splits one sentence into course, "and", "or", "(", ")" tokens, null if anything else is left over
    function tokenize(sentence) {
        const tokens = [];
        let rest = sentence.trim();
        while (rest.length > 0) {
            let match;
            if ((match = rest.match(courseRe))) {
                const course = {prereqType: "course", coreq: false, courseId: `${match[1]} ${match[2]}`};
                rest = rest.slice(match[0].length).trim();
                // Modifiers can come in either order after the course
                let changed = true;
                while (changed) {
                    changed = false;
                    if ((match = rest.match(/^\(may be taken concurrently\)/i))) {
                        course.coreq = true;
                    } else if ((match = rest.match(new RegExp(`^with a minimum grade of ${GRADE}`)))
                        || (match = rest.match(new RegExp(`^with a grade of ${GRADE} or better`)))) {
                        course.minGrade = match[1];
                    } else {
                        continue;
                    }
                    rest = rest.slice(match[0].length).trim();
                    changed = true;
                }
                tokens.push(course);
            } else if ((match = rest.match(/^(and|or)\b/i))) {
                tokens.push(match[1].toLowerCase());
                rest = rest.slice(match[0].length).trim();
            } else if (rest[0] === "(" || rest[0] === ")") {
                tokens.push(rest[0]);
                rest = rest.slice(1).trim();
            } else {
                return null;
            }
        }
        return tokens;
    }

    // expr := term (op term)*, one operator per group, mixing "and" with "or" without parentheses is ambiguous so it fails
    function parseTokens(tokens) {
        let i = 0;
        function parseExpr() {
            const terms = [parseTerm()];
            let op = null;
            while (i < tokens.length && (tokens[i] === "and" || tokens[i] === "or")) {
                if (op !== null && tokens[i] !== op) {
                    throw new Error("mixed and/or");
                }
                op = tokens[i++];
                terms.push(parseTerm());
            }
            return op === null ? terms[0] : {[op.toUpperCase()]: terms};
        }
        function parseTerm() {
            const token = tokens[i++];
            if (token === "(") {
                const inner = parseExpr();
                if (tokens[i++] !== ")") {
                    throw new Error("missing )");
                }
                return inner;
            }
            if (token && typeof token === "object") {
                return token;
            }
            throw new Error("expected a course");
        }
        try {
            const result = parseExpr();
            return i === tokens.length ? result : null;
        } catch {
            return null;
        }
    }

    // Returns a tree in the same JSON shape AnteaterAPI uses ({AND: [...]}), or null when the text is too complex
    function parse(text) {
        const sentences = (text ?? "")
            .split(/\.(?:\s+|$)/)
            .map((sentence) => sentence.trim())
            .filter(Boolean);
        const required = [];
        for (const sentence of sentences) {
            // "Recommended: ..." isn't a requirement, sentences without a course code (writing requirement, standing) aren't drawable
            if (/^recommended/i.test(sentence) || !hasCourseCode(sentence)) {
                continue;
            }
            const tokens = tokenize(sentence);
            const tree = tokens && parseTokens(tokens);
            if (!tree) {
                return null;
            }
            required.push(...(tree.AND ?? [tree]));
        }
        return required.length > 0 ? {AND: dedupe(required)} : null;
    }

    return {parse, hasCourseCode};
}

// Texts often repeat a requirement ("MATH 2A. MATH 2A with a grade of C or better"), keep one copy
// A single course listed twice keeps the copy with the grade
function dedupe(requirements) {
    const result = [];
    for (const item of requirements) {
        const same = result.findIndex((other) =>
            item.prereqType === "course" && other.prereqType === "course"
                ? item.courseId === other.courseId
                : JSON.stringify(item) === JSON.stringify(other));
        if (same === -1) {
            result.push(item);
        } else if (item.minGrade && !result[same].minGrade) {
            result[same] = item;
        }
    }
    return result;
}

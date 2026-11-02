// Reads the prerequisite_tree that /api/course/:id sends and turns it into a list of requirements
// In the data, the root is an AND, inside is either a single course/exam, and OR group, or a NOT group

// I&C SCI 46 becomes I&CSCI46, tree ids are including spaces, need to get rid of them
export function normalizeCourseId(courseId) {
    return courseId.replace(/\s+/g, "");
}

// "AP CALCULUS BC" -> "AP Calculus BC", "AP ECONOMICS:MICRO" -> "AP Economics: Micro"
export function formatExamName(name) {
  return name.split(/(:)/).map((part) => (part === ":" ? ": " : part)).join("").split(" ").map((word) => {
        if (word === "") {
            return word;
        }
        if (/^[A-Z/]{1,2}$/.test(word) || /^[A-Z]\/[A-Z]$/.test(word)) {
            return word;
        }
        return word.charAt(0) + word.slice(1).toLowerCase();
    }).join(" ").replace(/:\s+/g, ": ");
}

function isLeaf(node) {
    return node.prereqType === "course" || node.prereqType === "exam";
}

function toLeaf(node) {
    if (node.prereqType === "course") {
        return {
            type: "course",
            id: normalizeCourseId(node.courseId),
            label: node.courseId,
            minGrade: node.minGrade ?? null,
            coreq: Boolean(node.coreq),
        };
    }
    const score = node.minGrade ?? null;
    const name = formatExamName(node.examName);
    return {
        type: "exam",
        id: `exam:${node.examName}:${score}`,
        label: score ? `${name} (${score}+)` : name,
        minGrade: score,
    };
}

// "(grade C or better)", "(may be taken at the same time)", or "" when there is nothing to add
function leafNote(leaf) {
  const notes = [];
  if (leaf.type === "course" && leaf.minGrade && leaf.minGrade !== "D-") {
    notes.push(`grade ${leaf.minGrade} or better`);
  }
  if (leaf.type === "course" && leaf.coreq) notes.push("may be taken at the same time");
  return notes.length ? ` (${notes.join(", ")})` : "";
}

function leafText(leaf) {
  return leaf.type === "exam" ? leaf.label : `${leaf.label}${leafNote(leaf)}`;
}

// Returns { required: ["ICS 46 (grade C or better)", "One of: MATH 2B, AP Calculus BC (4+)"], excluded: ["MATH 7B"] }
export function describeRequirements(parsed) {
  return {
    required: parsed.required.map((item) =>
      item.type === "oneOf" ? `One of: ${item.options.map(leafText).join(", ")}` : leafText(item)
    ),
    excluded: parsed.excluded.map((leaf) => leaf.label),
  };
}

// An OR group becomes a list of leaves, an OR inside an OR is flattened (a or (b or c) is the same as a or b or c, anything else is null
function collectOptions(orChildren) {
    const options = [];
    for (const child of orChildren) {
        if (isLeaf(child)) {
            options.push(toLeaf(child));
        } else if (child.OR) {
            const nested = collectOptions(child.OR);
            if (nested === null) {
                return null;
            }
            options.push(...nested);
        } else {
            return null;
        }
    }
    const seen = new Set();
    return options.filter((option) => (seen.has(option.id) ? false : seen.add(option.id)));
}

// Collects the contents of an AND group (nested ANDs are flattened too).
function collectRequirements(andChildren, result) {
    for (const child of andChildren) {
        if (isLeaf(child)) {
            result.required.push(toLeaf(child));
        } else if (child.AND) {
            if (collectRequirements(child.AND, result) === null) return null;
        } else if (child.OR) {
            const options = collectOptions(child.OR);
            if (options === null) {
                return null;
            }
            if (options.length === 1) {
                result.required.push(options[0]);
            }
            else if (options.length > 1) {
                result.required.push({ type: "oneOf", options });
            }
        } else if (child.NOT) {
            for (const excluded of child.NOT) {
                if (!isLeaf(excluded)) return null;
                    result.excluded.push(toLeaf(excluded));
            }
        } else {
            return null;
        }
    }
    return result;
}

export function parsePrereqTree(tree) {
    if (tree === undefined || tree === null) {
        return null;
    }
    const result = { required: [], excluded: [] };
    if (Object.keys(tree).length === 0) {
        return result;
    }
    if (isLeaf(tree)) {
        return collectRequirements([tree], result);
    }
    if (tree.AND) {
        return collectRequirements(tree.AND, result);
    }
    if (tree.OR) {
        return collectRequirements([tree], result);
    }
    return null;
}
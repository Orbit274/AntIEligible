import { getSourceNode } from "./courseGraph.js";
import { CourseStatus } from "../enums/courseStatus.js";

// Whether a single prerequisite node counts as met for the student:
// - info node (exam): treated as satisfied, we assume the credit is held
// - course node: satisfied only when marked completed
// - logic node "OR": satisfied as soon as any one option is satisfied
// - logic node "AND": satisfied only when every option is satisfied
// Recurses through logic nodes; course and info nodes are terminal.
function isPrereqSatisfied(nodeId, nodesById, edges) {
  const node = nodesById.get(nodeId);
  if (!node) {
    return false;
  }
  if (node.type === "infoNode") {
    return true;
  }
  if (node.type === "courseNode") {
    return node.data?.status === CourseStatus.COMPLETED;
  }
  if (node.type === "logicNode") {
    const options = getSourceNode(edges, nodeId);
    if (node.data?.label === "AND") {
      return options.every((optionId) => isPrereqSatisfied(optionId, nodesById, edges));
    }
    // "OR" (default): one satisfied option is enough
    return options.some((optionId) => isPrereqSatisfied(optionId, nodesById, edges));
  }
  return false;
}

// Counts how many of a course's direct prerequisites are still unmet.
// Each direct requirement counts once: a lone prerequisite course, or a whole
// OR/AND logic group. Exams never add to the total. Returns 0 when the course
// is eligible (no prerequisites, or all of them satisfied).
export function countMissingPrerequisites(courseId, graph) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const directPrereqs = getSourceNode(graph.edges, courseId);
  return directPrereqs.filter(
    (prereqId) => !isPrereqSatisfied(prereqId, nodesById, graph.edges),
  ).length;
}

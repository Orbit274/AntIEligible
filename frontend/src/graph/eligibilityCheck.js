import { getSourceNode } from "./courseGraph.js";
import { CourseStatus } from "../enums/courseStatus.js";

// Whether a single prerequisite node counts as met for the student:
// - info node (exam): satisfied only when the student has ticked its checkbox
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
    return node.data?.satisfied === true;
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
// Each direct requirement counts once: a lone prerequisite course or exam, or a
// whole OR/AND logic group. Returns 0 when the course is eligible (no
// prerequisites, or all of them satisfied).
export function countMissingPrerequisites(courseId, graph) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const directPrereqs = getSourceNode(graph.edges, courseId);
  return directPrereqs.filter(
    (prereqId) => !isPrereqSatisfied(prereqId, nodesById, graph.edges),
  ).length;
}

// A readable label for one unmet direct prerequisite: a course/exam shows its
// own label, a logic group lists its options ("One of: A, B" / "All of: A, B").
function describeMissing(nodeId, nodesById, edges) {
  const node = nodesById.get(nodeId);
  if (!node) {
    return nodeId;
  }
  if (node.type === "logicNode") {
    const options = getSourceNode(edges, nodeId).map(
      (optionId) => nodesById.get(optionId)?.data?.label ?? optionId,
    );
    const joiner = node.data?.label === "AND" ? "All of" : "One of";
    return `${joiner}: ${options.join(", ")}`;
  }
  return node.data?.label ?? nodeId;
}

// Readable labels for each of a course's still-unmet direct prerequisites,
// in graph order. Mirrors countMissingPrerequisites (same requirements).
export function getMissingPrerequisites(courseId, graph) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const directPrereqs = getSourceNode(graph.edges, courseId);
  return directPrereqs
    .filter((prereqId) => !isPrereqSatisfied(prereqId, nodesById, graph.edges))
    .map((prereqId) => describeMissing(prereqId, nodesById, graph.edges));
}

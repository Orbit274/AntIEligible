// Turns course data from the API into React Flow nodes + edges.

import { getConnectedEdges } from "@xyflow/react";

const COLUMN_GAP = 300;
const ROW_GAP = 150;

// One React Flow node
export function makeNode(id, label, x, y, status = "not-started") {
  return {
    id,
    type: "courseNode",
    position: { x, y },
    data: { label, status, isExpanded : false},
  };
}

export function removePrereqCourseNode(graph, courseId){
    const queue = getSourceNode(graph.edges, courseId);
    console.log(queue);
    let newEdges = removePrereqEdge(graph.edges, courseId);
    while(queue.length > 0){
      const popCourse = queue.shift();
      console.log(popCourse);
      if(!isConnectedToOtherParent(newEdges, popCourse)){
        getSourceNode(newEdges, popCourse).forEach((node) => queue.push(node));
        newEdges = removePrereqEdge(newEdges, popCourse);
      }
    }
    const remainingNode = cleanUpDisconnectedNode(graph.nodes, newEdges);
    console.log(remainingNode);
    return {nodes: remainingNode, edges: newEdges};
}

function getSourceNode(edges, courseId){
  const nodes = edges.map((edge) => edge.target === courseId ? edge.source : null);
  return nodes.filter((node) => node !== null);
}

export function removePrereqEdge(edges, courseId){
  const newEdge = edges.filter((edge) => edge.target !== courseId);
  return newEdge;
}

function isConnectedToOtherParent(edges, courseId){
    return edges.some((e) => e.source === courseId);
}

function cleanUpDisconnectedNode(nodes, edges){
    const rootNode = nodes[0];
    const connectedNode = nodes.map((node) => getConnectedEdges([node], edges).length > 0 ? node : null);
    const filteredConnectedNode = connectedNode.filter((node) => node !== null);
    return filteredConnectedNode.length > 0 ? filteredConnectedNode : [rootNode];
}
// An edge points from the prerequisite to the course that needs it
export function makeEdge(prereqId, courseId) {
  return { id: `${prereqId}->${courseId}`, source: prereqId, target: courseId, animated: false };
}

// Adds a course and its direct prerequisites to a graph and returns a new graph
// Course that is already in the graph is reused
// New prerequisites are placed one column to the right
export function addCourseToGraph(graph, course, origin = { x: 0, y: 0 }) {
  const nodes = [...graph.nodes];
  const edges = [...graph.edges];
  const hasNode = (id) => nodes.some((n) => n.id === id);

  if (!hasNode(course.id)) {
    nodes.push(makeNode(course.id, `${course.department} ${course.course_number}`, origin.x, origin.y));
  }

  const prereqs = course.prerequisites ?? [];
  prereqs.forEach((p, i) => {
    if (!hasNode(p.id)) {
      const y = origin.y + (i - (prereqs.length - 1) / 2) * ROW_GAP;
      nodes.push(makeNode(p.id, `${p.department} ${p.course_number}`, origin.x + COLUMN_GAP, y));
    }
    const edge = makeEdge(p.id, course.id);
    if (!edges.some((e) => e.id === edge.id)) edges.push(edge);
  });
  //First node will initially expand 
  nodes[0].data.isExpanded = true;
  return { nodes, edges };
}

// Clear the workspace, same function, start from an empty graph
export function buildCourseGraph(course) {
  return addCourseToGraph({ nodes: [], edges: [] }, course, { x: 0, y: 0 });
}
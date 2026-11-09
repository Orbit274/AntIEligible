// Turns course data from the API into React Flow nodes + edges.

// import { getConnectedEdges } from "@xyflow/react";
import { parsePrereqTree } from "./prereqTree.js";

const COLUMN_GAP = 250;
const ROW_GAP = 150;
const LOGIC_ROW_GAP = 90;
const LOGIC_GROUP_GAP = 50;
const NODE_HEIGHT = 60;
const TREE_GAP = 120;

// One React Flow node
export function makeNode(id, label, x, y, status = "not-started") {
  return {
    id,
    type: "courseNode",
    position: { x, y },
    data: { label, status, isExpanded : false},
  };
}

// The small "OR" circle, many options feed into it and one line leaves it toward the course
export function makeLogicNode(id, x, y) {
  return { id, type: "logicNode", position: { x, y }, data: { label: "OR" } };
}

// A box for something that isn't a course we can open like an exam
export function makeInfoNode(id, label, x, y, kind) {
  return { id, type: "infoNode", position: { x, y }, data: { label, kind } };
}

export function removePrereqCourseNode(graph, courseId) {
    const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
    const queue = getSourceNode(graph.edges, courseId);
    let edges = removePrereqEdge(graph.edges, courseId);
    const removed = new Set();
    while(queue.length > 0) {
      const popCourse = queue.shift();
      const node = nodesById.get(popCourse);
      if(!node || removed.has(popCourse) || node.data?.pinned) {
        continue;
      }
      if(isConnectedToOtherParent(edges, popCourse)) {
        continue;
      }
      removed.add(popCourse);
      getSourceNode(edges, popCourse).forEach((source) => queue.push(source));
      edges = removePrereqEdge(edges, popCourse);
    }
    return {nodes: graph.nodes.filter((node) => !removed.has(node.id)), edges};
}

// Removes one course from the workspace, plus whatever only it needed plus every line touching it
export function removeCourseFromGraph(graph, courseId){
    const collapsed = removePrereqCourseNode(graph, courseId);
    let nodes = collapsed.nodes.filter((node) => node.id !== courseId);
    let edges = collapsed.edges.filter((edge) => edge.source !== courseId && edge.target !== courseId);
    let changed = true;
    while(changed) {
      changed = false;
      for(const node of nodes){
        if(node.type === "logicNode" && !edges.some((edge) => edge.target === node.id)){
          nodes = nodes.filter((other) => other.id !== node.id);
          edges = edges.filter((edge) => edge.source !== node.id);
          changed = true;
          break;
        }
      }
    }
    return {nodes, edges};
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

export function pinNode(graph, id){
  return {
    nodes: graph.nodes.map((n) => n.id === id ? {...n, data: {...n.data, pinned: true}} : n),
    edges: graph.edges,
  };
}

// An edge points from the prerequisite to the course that needs it
export function makeEdge(prereqId, courseId) {
  return { id: `${prereqId}->${courseId}`, source: prereqId, target: courseId, animated: false };
}

// Dashed line, used from options in the OR circle
const DASHED = { strokeDasharray: "6 4" };

// One solid edge per course in the flat list (no AND/OR information)
function addFlatPrerequisites(nodes, edges, course, origin) {
  const prereqs = course.prerequisites ?? [];
  prereqs.forEach((p, i) => {
    if (!nodes.some((n) => n.id === p.id)) {
      const y = origin.y + (i - (prereqs.length - 1) / 2) * ROW_GAP;
      nodes.push(makeNode(p.id, `${p.department} ${p.course_number}`, origin.x + COLUMN_GAP, y));
    }
    const edge = makeEdge(p.id, course.id);
    if (!edges.some((e) => e.id === edge.id)) {
      edges.push(edge);
    }
  });
}

// Pushes an edge unless the same edge (same id) is already there
function pushEdge(edges, edge) {
  if (!edges.some((e) => e.id === edge.id)) {
    edges.push(edge);
  }
}

// A node for one leaf of the tree (a course or an exam), created only if it isn't on the graph yet
function pushLeafNode(nodes, leaf, x, y) {
  if (nodes.some((n) => n.id === leaf.id)){
    return;
  }
  if (leaf.type === "exam") {
    nodes.push(makeInfoNode(leaf.id, leaf.label, x, y, "exam"));
  } else {
    nodes.push(makeNode(leaf.id, leaf.label, x, y));
  }
}

// Lays the requirements out in two columns to the right of the course
// column 1 has single required courses, and the OR circles
// column 2 has the options that feed each OR circle
// Each requirement gets its own block of rows so different OR groups never overlap
function addTreePrerequisites(nodes, edges, course, required, origin) {
  let nextRow = 0;
  const placed = required.map((item) => {
    const rows = item.type === "oneOf" ? item.options.length : 1;
    const top = nextRow;
    nextRow += rows * LOGIC_ROW_GAP + LOGIC_GROUP_GAP;
    return { item, rows, top };
  });

  const lastRowTop = nextRow - LOGIC_GROUP_GAP - LOGIC_ROW_GAP;
  const offset = origin.y - lastRowTop / 2;
  const column1 = origin.x + COLUMN_GAP;
  const column2 = origin.x + 1.4 * COLUMN_GAP;

  placed.forEach(({ item, rows, top }, index) => {
    const y = offset + top;
    if (item.type !== "oneOf") {
      pushLeafNode(nodes, item, column1, y);
      pushEdge(edges, { ...makeEdge(item.id, course.id), data: { minGrade: item.minGrade, coreq: item.coreq ?? false } });
      return;
    }
    
    const orId = `or:${course.id}:${index}`;
    if (!nodes.some((n) => n.id === orId)) {
      nodes.push(makeLogicNode(orId, column1, y + ((rows - 1) / 2) * LOGIC_ROW_GAP));
    }
    pushEdge(edges, makeEdge(orId, course.id));
    item.options.forEach((option, i) => {
      pushLeafNode(nodes, option, column2, y + i * LOGIC_ROW_GAP);
      pushEdge(edges, {
        ...makeEdge(option.id, orId),
        style: DASHED,
        data: { minGrade: option.minGrade, coreq: option.coreq ?? false },
      });
    });
  });
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

  const parsed = parsePrereqTree(course.prerequisite_tree);
  if (parsed) {
    addTreePrerequisites(nodes, edges, course, parsed.required, origin);
  } else {
    addFlatPrerequisites(nodes, edges, course, origin);
  }

  //First node will initially expand 
  const expandedIndex = nodes.findIndex((n) => n.id === course.id);
  if (expandedIndex !== -1) {
    nodes[expandedIndex] = { ...nodes[expandedIndex], data: { ...nodes[expandedIndex].data, isExpanded: true } };
  }
  return { nodes, edges };
}

// Adds a course to the current workspace instead of replacing it
export function addCourseToWorkspace(graph, course) {
  const existing = graph.nodes.find((n) => n.id === course.id);
  let origin;
  if (existing) {
    origin = existing.position;
  } else if (graph.nodes.length === 0) {
    origin = {x: 0, y: 0};
  } else {
    const alone = buildCourseGraph(course);
    const topOfNewTree = Math.min(...alone.nodes.map((n) => n.position.y));
    const bottomOfWorkspace = Math.max(...graph.nodes.map((n) => n.position.y)) + NODE_HEIGHT;
    origin = {x: 0, y: bottomOfWorkspace + TREE_GAP - topOfNewTree};
  }
  const merged = pinNode(addCourseToGraph(graph, course, origin), course.id);
  const oldIds = new Set(graph.nodes.map((n) => n.id));
  const newIds = merged.nodes.filter((n) => !oldIds.has(n.id)).map((n) => n.id);
  return {graph: merged, focusIds: [...new Set([course.id, ...newIds])]};
}

// Builds the whole prerequisite tree from /api/course-tree
// Each course goes in the column of its longest path from the root, so every edge points right to left
export function buildFullCourseGraph(tree) {
  const depth = new Map([[tree.id, 0]]);
  // Relax edges until depths settle, capped so a cycle in the data can't loop forever
  for (let i = 0; i < tree.courses.length; i++) {
    let changed = false;
    for (const e of tree.edges) {
      const d = (depth.get(e.course_id) ?? 0) + 1;
      if (d > (depth.get(e.prereq_id) ?? -1)) {
        depth.set(e.prereq_id, d);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const columns = new Map();
  tree.courses.forEach((c) => {
    const d = depth.get(c.id) ?? 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d).push(c);
  });

  const hasPrereqs = new Set(tree.edges.map((e) => e.course_id));
  const nodes = [];
  columns.forEach((courses, d) => {
    courses.forEach((c, i) => {
      const y = (i - (courses.length - 1) / 2) * ROW_GAP;
      const node = makeNode(c.id, `${c.department} ${c.course_number}`, d * COLUMN_GAP, y);
      node.data.isExpanded = hasPrereqs.has(c.id);
      nodes.push(node);
    });
  });
  // Root goes first, cleanUpDisconnectedNode falls back to nodes[0]
  nodes.sort((a, b) => (a.id === tree.id ? -1 : b.id === tree.id ? 1 : 0));

  const edges = tree.edges.map((e) => makeEdge(e.prereq_id, e.course_id));
  return { nodes, edges };
}

// Adds a course's whole prerequisite tree to the current workspace, placed below what's already there
// Courses already on the workspace are reused, only the new ones are placed
export function addFullTreeToWorkspace(graph, tree) {
  const full = buildFullCourseGraph(tree);
  const oldIds = new Set(graph.nodes.map((n) => n.id));
  let dy = 0;
  if (graph.nodes.length > 0) {
    const topOfNewTree = Math.min(...full.nodes.map((n) => n.position.y));
    const bottomOfWorkspace = Math.max(...graph.nodes.map((n) => n.position.y)) + NODE_HEIGHT;
    dy = bottomOfWorkspace + TREE_GAP - topOfNewTree;
  }
  const newNodes = full.nodes
    .filter((n) => !oldIds.has(n.id))
    .map((n) => ({ ...n, position: { x: n.position.x, y: n.position.y + dy } }));
  const edges = [...graph.edges];
  full.edges.forEach((edge) => pushEdge(edges, edge));

  const merged = pinNode({ nodes: [...graph.nodes, ...newNodes], edges }, tree.id);
  return { graph: merged, focusIds: [...new Set([tree.id, ...newNodes.map((n) => n.id)])] };
}

// Clear the workspace, same function, start from an empty graph
export function buildCourseGraph(course) {
  const graph = addCourseToGraph({ nodes: [], edges: [] }, course, { x: 0, y: 0 });
  return pinNode(graph, course.id);
}
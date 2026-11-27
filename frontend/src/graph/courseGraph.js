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
    data: { label, status, isExpanded : false, courseId: id },
  };
}

// The course a node stands for. Usually its id, but a course can be on the workspace
// more than once, and the extra cards get ids like "COMPSCI161#2"
export function courseIdOf(node) {
  return node.data?.courseId ?? node.id;
}

// `base`, or `base#2`, `base#3`... whichever isn't taken yet
function freshId(base, taken) {
  let id = base;
  for (let copy = 2; taken.has(id); copy++) {
    id = `${base}#${copy}`;
  }
  return id;
}

// The small "OR" circle, many options feed into it and one line leaves it toward the course
export function makeLogicNode(id, x, y) {
  return { id, type: "logicNode", position: { x, y }, data: { label: "OR" } };
}

// A box for something that isn't a course we can open like an exam
// Starts not satisfied; the student ticks its checkbox once they have the credit
export function makeInfoNode(id, label, x, y, kind) {
  return { id, type: "infoNode", position: { x, y }, data: { label, kind, satisfied: false, courseId: id } };
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

export function getSourceNode(edges, courseId){
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
function addFlatPrerequisites(nodes, edges, target, prereqs, origin) {
  prereqs.forEach((p, i) => {
    const y = origin.y + (i - (prereqs.length - 1) / 2) * ROW_GAP;
    const leaf = { type: "course", id: p.id, label: `${p.department} ${p.course_number}` };
    const prereqId = pushLeafNode(nodes, leaf, origin.x + COLUMN_GAP, y, target.treeId);
    pushEdge(edges, makeEdge(prereqId, target.id));
  });
}

// Pushes an edge unless the same edge (same id) is already there
function pushEdge(edges, edge) {
  if (!edges.some((e) => e.id === edge.id)) {
    edges.push(edge);
  }
}

// The node for one leaf of the tree (a course or an exam), returns its id
// Reuses a card for the same course only inside the same tree, cards from other trees get a new copy
function pushLeafNode(nodes, leaf, x, y, treeId) {
  const existing = nodes.find((n) => courseIdOf(n) === leaf.id && n.data?.treeId === treeId);
  if (existing) {
    return existing.id;
  }
  const id = freshId(leaf.id, new Set(nodes.map((n) => n.id)));
  const node = leaf.type === "exam"
    ? makeInfoNode(id, leaf.label, x, y, "exam")
    : makeNode(id, leaf.label, x, y);
  node.data.courseId = leaf.id;
  node.data.treeId = treeId;
  nodes.push(node);
  return id;
}

// Lays the requirements out in two columns to the right of the course
// column 1 has single required courses, and the OR circles
// column 2 has the options that feed each OR circle
// Each requirement gets its own block of rows so different OR groups never overlap
function addTreePrerequisites(nodes, edges, target, required, origin) {
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
      const prereqId = pushLeafNode(nodes, item, column1, y, target.treeId);
      pushEdge(edges, { ...makeEdge(prereqId, target.id), data: { minGrade: item.minGrade, coreq: item.coreq ?? false } });
      return;
    }
    
    const orId = `or:${target.id}:${index}`;
    if (!nodes.some((n) => n.id === orId)) {
      const orNode = makeLogicNode(orId, column1, y + ((rows - 1) / 2) * LOGIC_ROW_GAP);
      orNode.data.treeId = target.treeId;
      nodes.push(orNode);
    }
    pushEdge(edges, makeEdge(orId, target.id));
    item.options.forEach((option, i) => {
      const optionId = pushLeafNode(nodes, option, column2, y + i * LOGIC_ROW_GAP, target.treeId);
      pushEdge(edges, {
        ...makeEdge(optionId, orId),
        style: DASHED,
        data: { minGrade: option.minGrade, coreq: option.coreq ?? false },
      });
    });
  });
}

// Adds a course and its direct prerequisites to a graph and returns a new graph
// nodeId is the course's card, reused if it's already in the graph (expanding a node passes its own id)
// New prerequisites are placed one column to the right
export function addCourseToGraph(graph, course, origin = { x: 0, y: 0 }, nodeId = course.id) {
  const nodes = [...graph.nodes];
  const edges = [...graph.edges];

  let courseNode = nodes.find((n) => n.id === nodeId);
  if (!courseNode) {
    courseNode = makeNode(nodeId, `${course.department} ${course.course_number}`, origin.x, origin.y);
    courseNode.data.courseId = course.id;
    nodes.push(courseNode);
  }
  const target = { id: nodeId, treeId: courseNode.data.treeId };

  const parsed = parsePrereqTree(course.prerequisite_tree);
  if (parsed) {
    addTreePrerequisites(nodes, edges, target, parsed.required, origin);
  } else {
    addFlatPrerequisites(nodes, edges, target, course.prerequisites ?? [], origin);
  }

  //First node will initially expand 
  const expandedIndex = nodes.findIndex((n) => n.id === nodeId);
  if (expandedIndex !== -1) {
    nodes[expandedIndex] = {
      ...nodes[expandedIndex],
      data: { ...nodes[expandedIndex].data, isExpanded: true, unverified: course.prerequisite_source === "unparsed" },
    };
  }
  return { nodes, edges };
}

// Puts a separately built tree below everything on the workspace, as its own tree
// It never connects to cards already there: a course that's already on the workspace gets
// a new card ("COMPSCI161#2"), so every searched course keeps its own tidy layout
// Returns the merged graph, the root's new id, and the ids of every added node
function appendTree(graph, tree, rootId) {
  let dy = 0;
  if (graph.nodes.length > 0) {
    const topOfNewTree = Math.min(...tree.nodes.map((n) => n.position.y));
    const bottomOfWorkspace = Math.max(...graph.nodes.map((n) => n.position.y)) + NODE_HEIGHT;
    dy = bottomOfWorkspace + TREE_GAP - topOfNewTree;
  }

  const taken = new Set(graph.nodes.map((n) => n.id));
  const rename = new Map();
  tree.nodes.forEach((n) => {
    const id = freshId(n.id, taken);
    taken.add(id);
    rename.set(n.id, id);
  });
  // The root's id marks which tree every node belongs to, expanding a node reuses cards from its own tree only
  const treeId = rename.get(rootId);

  const newNodes = tree.nodes.map((n) => ({
    ...n,
    id: rename.get(n.id),
    position: { x: n.position.x, y: n.position.y + dy },
    data: { ...n.data, treeId },
  }));
  const newEdges = tree.edges.map((e) => {
    const source = rename.get(e.source);
    const target = rename.get(e.target);
    return { ...e, id: `${source}->${target}`, source, target };
  });
  return {
    graph: { nodes: [...graph.nodes, ...newNodes], edges: [...graph.edges, ...newEdges] },
    rootId: treeId,
    newIds: newNodes.map((n) => n.id),
  };
}

// Adds a course and its first layer of prerequisites to the current workspace instead of replacing it
export function addCourseToWorkspace(graph, course) {
  const { graph: merged, newIds } = appendTree(graph, buildCourseGraph(course), course.id);
  return { graph: merged, focusIds: newIds };
}

// Builds the whole prerequisite tree from /api/course-tree
// Each course is read with parsePrereqTree, so OR groups get the same circle + dashed lines as addTreePrerequisites
// Every node goes in the column of its longest path from the root, so every edge points right to left
export function buildFullCourseGraph(tree) {
  // What each node is, positions are filled in once the columns are known
  const kinds = new Map();
  const edges = [];
  const addKind = (id, kind) => {
    if (!kinds.has(id)) kinds.set(id, kind);
  };
  const addLeaf = (leaf) =>
    addKind(leaf.id, leaf.type === "exam" ? { type: "exam", label: leaf.label } : { type: "course", label: leaf.label });

  tree.courses.forEach((c) =>
    addKind(c.id, {
      type: "course",
      label: `${c.department} ${c.course_number}`,
      unverified: c.prerequisite_source === "unparsed",
    }),
  );

  tree.courses.forEach((c) => {
    const parsed = parsePrereqTree(c.prerequisite_tree);
    // Tree we can't read, fall back to the flat edges for this course
    if (!parsed) {
      tree.edges
        .filter((e) => e.course_id === c.id)
        .forEach((e) => pushEdge(edges, makeEdge(e.prereq_id, c.id)));
      return;
    }
    parsed.required.forEach((item, index) => {
      if (item.type !== "oneOf") {
        addLeaf(item);
        pushEdge(edges, { ...makeEdge(item.id, c.id), data: { minGrade: item.minGrade, coreq: item.coreq ?? false } });
        return;
      }
      const orId = `or:${c.id}:${index}`;
      addKind(orId, { type: "or" });
      pushEdge(edges, makeEdge(orId, c.id));
      item.options.forEach((option) => {
        addLeaf(option);
        pushEdge(edges, {
          ...makeEdge(option.id, orId),
          style: DASHED,
          data: { minGrade: option.minGrade, coreq: option.coreq ?? false },
        });
      });
    });
  });

  // An edge goes source (prerequisite) -> target (course that needs it)
  const depth = new Map([[tree.id, 0]]);
  // Relax edges until depths settle, capped so a cycle in the data can't loop forever
  for (let i = 0; i < kinds.size; i++) {
    let changed = false;
    for (const e of edges) {
      const d = (depth.get(e.target) ?? 0) + 1;
      if (d > (depth.get(e.source) ?? -1)) {
        depth.set(e.source, d);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const columns = new Map();
  kinds.forEach((kind, id) => {
    const d = depth.get(id) ?? 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d).push(id);
  });

  const hasPrereqs = new Set(edges.map((e) => e.target));
  const nodes = [];
  columns.forEach((ids, d) => {
    ids.forEach((id, i) => {
      const kind = kinds.get(id);
      const x = d * COLUMN_GAP;
      const y = (i - (ids.length - 1) / 2) * ROW_GAP;
      if (kind.type === "or") {
        nodes.push(makeLogicNode(id, x, y));
      } else if (kind.type === "exam") {
        nodes.push(makeInfoNode(id, kind.label, x, y, "exam"));
      } else {
        const node = makeNode(id, kind.label, x, y);
        node.data.isExpanded = hasPrereqs.has(id);
        node.data.unverified = kind.unverified ?? false;
        nodes.push(node);
      }
    });
  });
  // Root goes first, cleanUpDisconnectedNode falls back to nodes[0]
  nodes.sort((a, b) => (a.id === tree.id ? -1 : b.id === tree.id ? 1 : 0));

  return { nodes, edges };
}

// Adds a course's whole prerequisite tree to the current workspace, placed below what's already there
export function addFullTreeToWorkspace(graph, tree) {
  const { graph: merged, rootId, newIds } = appendTree(graph, buildFullCourseGraph(tree), tree.id);
  return { graph: pinNode(merged, rootId), focusIds: newIds };
}

// Clear the workspace, same function, start from an empty graph
export function buildCourseGraph(course) {
  const graph = addCourseToGraph({ nodes: [], edges: [] }, course, { x: 0, y: 0 });
  return pinNode(graph, course.id);
}
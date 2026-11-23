// Switches node positions between the two ways the graph can be drawn.
// All layout code in courseGraph.js works in left-to-right coordinates
// (x = depth from the target, y = siblings); a top-down graph is the same layout
// rotated so depth runs down the y axis and siblings spread along the x axis.

export const Orientation = Object.freeze({
  LEFT_TO_RIGHT: "left-to-right",
  TOP_DOWN: "top-down",
});

// Rotating alone would overlap nodes: they are much wider than tall, and OR
// options are only 90px apart. So siblings are stretched apart and the depth
// gap shrunk. Linear, so converting back and forth gives the original layout.
const SIBLING_SCALE = 2;
const DEPTH_SCALE = 0.8;

// Rough rendered size of each node type (matches the CSS). Positions are a
// node's top-left corner, so we rotate around the center to keep small nodes
// (the OR circle) lined up with the big ones.
const NODE_SIZE = {
  courseNode: { width: 120, height: 60 },
  logicNode: { width: 40, height: 40 },
  infoNode: { width: 150, height: 36 },
};
const DEFAULT_SIZE = NODE_SIZE.courseNode;

function sizeOf(node) {
  return NODE_SIZE[node.type] ?? DEFAULT_SIZE;
}

function mapCenter(node, toCenter) {
  const { width, height } = sizeOf(node);
  const center = { x: node.position.x + width / 2, y: node.position.y + height / 2 };
  const next = toCenter(center);
  return { ...node, position: { x: next.x - width / 2, y: next.y - height / 2 } };
}

// Left-to-right graph -> same graph drawn in `orientation`
export function fromLeftToRight(graph, orientation) {
  if (orientation !== Orientation.TOP_DOWN) return graph;
  return {
    nodes: graph.nodes.map((n) =>
      mapCenter(n, (c) => ({ x: c.y * SIBLING_SCALE, y: c.x * DEPTH_SCALE })),
    ),
    edges: graph.edges,
  };
}

// Graph drawn in `orientation` -> left-to-right graph
export function toLeftToRight(graph, orientation) {
  if (orientation !== Orientation.TOP_DOWN) return graph;
  return {
    nodes: graph.nodes.map((n) =>
      mapCenter(n, (c) => ({ x: c.y / DEPTH_SCALE, y: c.x / SIBLING_SCALE })),
    ),
    edges: graph.edges,
  };
}

// Converts a graph drawn in one orientation to another
export function convertOrientation(graph, from, to) {
  if (from === to) return graph;
  return fromLeftToRight(toLeftToRight(graph, from), to);
}

// Runs a left-to-right layout function on a graph drawn in `orientation` and
// converts its resulting graph back, so courseGraph.js never needs to know.
export function layoutIn(orientation, graph, layout) {
  return fromLeftToRight(layout(toLeftToRight(graph, orientation)), orientation);
}

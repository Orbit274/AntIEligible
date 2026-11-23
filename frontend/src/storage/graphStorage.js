import { readItem, readJSON, writeItem, writeJSON } from "./localStore";
import { Orientation } from "../graph/orientation";

// Bump the version when the saved shape changes, so old data is ignored instead of breaking the graph
const GRAPH_STORAGE_KEY = "antieligible.graph.v1";
const ORIENTATION_STORAGE_KEY = "antieligible.graphOrientation";

// React Flow adds these while the user interacts; they describe the moment, not the graph
function withoutInteractionState({
  selected: _selected,
  dragging: _dragging,
  measured: _measured,
  ...node
}) {
  return node;
}

function withoutSelection({ selected: _selected, ...edge }) {
  return edge;
}

/**
 * Saves the workspace graph (nodes with their positions and data, and edges).
 * @param graph : { nodes, edges }
 */
export function saveGraph({ nodes, edges }) {
  writeJSON(GRAPH_STORAGE_KEY, {
    nodes: nodes.map(withoutInteractionState),
    edges: edges.map(withoutSelection),
  });
}

/**
 * @returns the saved { nodes, edges }, or null when there is nothing worth
 * showing (never saved, unreadable, or an empty workspace)
 */
export function loadSavedGraph() {
  const graph = readJSON(GRAPH_STORAGE_KEY, null);
  const isValid =
    Array.isArray(graph?.nodes) &&
    Array.isArray(graph?.edges) &&
    graph.nodes.length > 0;
  return isValid ? graph : null;
}

export function loadOrientation() {
  const saved = readItem(ORIENTATION_STORAGE_KEY);
  return Object.values(Orientation).includes(saved)
    ? saved
    : Orientation.LEFT_TO_RIGHT;
}

export function saveOrientation(orientation) {
  writeItem(ORIENTATION_STORAGE_KEY, orientation);
}

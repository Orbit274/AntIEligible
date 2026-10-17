import { ReactFlow, Background, MarkerType, useNodesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";
import Header from "./components/Header";
import CourseDetails from "./components/CourseDetails"
import { useState } from "react";
// Makes one box, so we don't repeat the same fields for every class
function makeNode(code, x, y) {
  return {
    id: code,
    position: { x: x, y: y },
    data: { label: code },
    className: "not-started",
    sourcePosition: "right", // arrows leave from the right side
    targetPosition: "left",  // arrows arrive on the left side
  };
}

const startingNodes = [
  // column 1: your goals
  makeNode("ICS 45J", 0, 0),
  makeNode("ICS 46", 0, 150),
  makeNode("ICS 51", 0, 300),

  // column 2
  makeNode("ICS 45C", 300, 75),
  makeNode("ICS 6B", 300, 250),

  // column 3
  makeNode("ICS 33", 600, 75),

  // column 4
  makeNode("ICS 32", 900, 75),
];

const edges = [
  { id: "45J-33", source: "ICS 45J", target: "ICS 33", animated: true},
  { id: "46-45C", source: "ICS 46", target: "ICS 45C", animated: true},
  { id: "46-6B", source: "ICS 46", target: "ICS 6B", animated: true },
  { id: "51-6B", source: "ICS 51", target: "ICS 6B", animated: false},
  { id: "45C-33", source: "ICS 45C", target: "ICS 33", animated: false },
  { id: "33-32", source: "ICS 33", target: "ICS 32", animated: false },
];

function nextStatus(status) {
  if (status === "not-started") return "in-progress";
  if (status === "in-progress") return "completed";
  return "not-started";
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(startingNodes);
  const [selectedCourse, setSelectedCourse] = useState(null);
  function handleNodeClick(event, clickedNode) {
    setSelectedCourse(clickedNode.data.id);
    setNodes(
      nodes.map((n) => {
        if (n.id !== clickedNode.id) return n;
        return { ...n, className: nextStatus(n.className) };
      })
    );
  }
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Header />
      {(selectedCourse !== null &&
        <CourseDetails courseId={selectedCourse} />
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
        fitView
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
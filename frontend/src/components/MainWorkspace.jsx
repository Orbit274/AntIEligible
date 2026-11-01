import CourseDetailsPanel from "./CourseDetailsPanel";
import {
  ReactFlow,
  Background,
  MarkerType,
  useNodesState,
  Panel,
  useEdgesState,
  ReactFlowProvider,
} from "@xyflow/react";
import { useState } from "react";
import SearchBar from "./SearchBar";
import CourseNode from "./CourseNode";
import "@xyflow/react/dist/style.css";
import "../styles/MainWorkspace.css";
import axios from "axios";
import ZoomControls from "./ZoomControls";
import GraphLegend from "./GraphLegend";
import {buildFullCourseGraph, makeNode, makeEdge} from "../graph/courseGraph";

const translateExtent = [
  [-100, -1000],
  [3000, 1000],
];
const nodeTypes = {
  courseNode: CourseNode,
};

const startingNodes = [
  makeNode("I&CSCI45J", "ICS 45J", 0, 0),
  makeNode("I&CSCI46", "ICS 46", 0, 150),
  makeNode("I&CSCI51", "ICS 51", 0, 300),

  makeNode("I&CSCI45C", "ICS 45C", 300, 75),
  makeNode("I&CSCI6B", "ICS 6B", 300, 250),

  makeNode("I&CSCI33", "ICS 33", 600, 75),
  makeNode("I&CSCI32", "ICS 32", 900, 75),
];

const initialEdges = [
  { ...makeEdge("I&CSCI33", "I&CSCI45J"), animated: true },
  { ...makeEdge("I&CSCI45C", "I&CSCI46"), animated: true },
  { ...makeEdge("I&CSCI6B", "I&CSCI46"), animated: true },
  makeEdge("I&CSCI6B", "I&CSCI51"),
  makeEdge("I&CSCI33", "I&CSCI45C"),
  makeEdge("I&CSCI32", "I&CSCI33"),
];

function nextStatus(status) {
  if (status === "not-started") return "in-progress";
  if (status === "in-progress") return "completed";
  return "not-started";
}

function MainWorkspace() {
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workspaceKey, setWorkspaceKey] = useState(0);

    function closePanel(){
      setIsVisible(false);
    }
    const [nodes, setNodes, onNodesChange] = useNodesState(startingNodes);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    function handleNodeClick(event, clickedNode) {
        const courseCode = clickedNode.id;
        setSelectedCourse(courseCode);
        setIsVisible(true);
    };
    // Called by the search bar, clears the workspace and shows that course plus its direct prerequisites
    async function handleSearchSelect(result) {
      try {
        const response = await axios.get(`/api/course-tree/${encodeURIComponent(result.id)}`);
        const tree = response.data;

        const graph = buildFullCourseGraph(tree);
        setNodes(graph.nodes);
        setEdges(graph.edges);
        setWorkspaceKey((key) => key + 1);

        setSelectedCourse(tree.id);
        setIsVisible(true);
      } catch (err) {
        console.error("Failed to load course:", err);
      }
    }
  return (
    <>
      <div id="main-body">
        <div id="main-workspace-container">
          <div id="main-workspace-header-container">
            <span className="main-workspace-label">COURSE SEARCH</span>
            <h1 className="main-workspace-title">
              Which course do you want to take next?
            </h1>
            <p className="search-description">
              Search any UCI course to map its prerequisites and check your
              eligibility.
            </p>
          </div>
          <div id="search-bar-container">
            <SearchBar onCourseChosen={handleSearchSelect} />
          </div>
          <CourseDetailsPanel
            courseId={selectedCourse}
            visible={isVisible}
            onClose={closePanel}
          />
          <div id="graph-container">
            <GraphLegend />
            <ReactFlowProvider>
              <ZoomControls />
              <div id="graph">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onNodesChange={onNodesChange}
                  onNodeClick={handleNodeClick}
                  onEdgesChange={onEdgesChange}
                  translateExtent={translateExtent}
                  proOptions={{ hideAttribution: true }}
                  defaultEdgeOptions={{
                    markerEnd: { type: MarkerType.ArrowClosed },
                  }}
                  fitView
                  key={workspaceKey}
                >
                  <Background />
                  {/* <Panel position="top-center">
              <SearchBar onCourseChosen={handleSearchSelect} />
            </Panel> */}
                </ReactFlow>
              </div>
            </ReactFlowProvider>
          </div>
        </div>
      </div>
    </>
  );
}

export default MainWorkspace;

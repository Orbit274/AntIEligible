import CourseDetailsPanel from "./CourseDetailsPanel";
import { ReactFlow, Background, MarkerType, useNodesState, Panel, useEdgesState} from "@xyflow/react";
import { useState} from "react";
import SearchBar from "./SearchBar";
import ResponsiveGraph from "./ResponsiveGraph";
import CourseNode from "./CourseNode";
import "@xyflow/react/dist/style.css";
import "../styles/MainWorkspace.css"
import axios from "axios";
import {buildCourseGraph, makeNode, makeEdge} from "../graph/courseGraph";


const nodeTypes = {
  courseNode : CourseNode,
}
//Maps the course node title to the course code in database
const courseCodeMap = new Map([
  ["ICS 45J", "I&CSCI45J"],
  ["ICS 46", "I&CSCI46"],
  ["ICS 51", "I&CSCI51"],
  ["ICS 45C", "I&CSCI45C"],
  ["ICS 6B", "I&CSCI6B"],
  ["ICS 33", "I&CSCI33"],
  ["ICS 32", "I&CSCI32"]
]);

const startingNodes = [
  makeNode("ICS 45J", "ICS 45J", 0, 0),
  makeNode("ICS 46", "ICS 46", 0, 150),
  makeNode("ICS 51", "ICS 51", 0, 300),

  makeNode("ICS 45C", "ICS 45C", 300, 75),
  makeNode("ICS 6B", "ICS 6B", 300, 250),

  makeNode("ICS 33", "ICS 33", 600, 75),
  makeNode("ICS 32", "ICS 32", 900, 75),
];

const initialEdges = [
  { id: "33-45J", source: "ICS 33", target: "ICS 45J", animated: true},
  { id: "45C-46", source: "ICS 45C", target: "ICS 46", animated: true},
  { id: "6B-46", source: "ICS 6B", target: "ICS 46", animated: true },
  { id: "6B-51", source: "ICS 6B", target: "ICS 51", animated: false},
  { id: "33-45C", source: "ICS 33", target: "ICS 45C", animated: false },
  { id: "32-33", source: "ICS 32", target: "ICS 33", animated: false },
];

function nextStatus(status) {
  if (status === "not-started") return "in-progress";
  if (status === "in-progress") return "completed";
  return "not-started";
}


function MainWorkspace(){
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
        const response = await axios.get(`/api/course/${encodeURIComponent(result.id)}`);
        const course = response.data;

        const graph = buildCourseGraph(course);
        setNodes(graph.nodes);
        setEdges(graph.edges);
        setWorkspaceKey((key) => key + 1);

        setSelectedCourse(course.id);
        setIsVisible(true);
      } catch (err) {
        console.error("Failed to load course:", err);
      }
    }
    return(
    <div style={{ width: "100vw", height: "100vh" }}>
    {true && (<CourseDetailsPanel courseId={selectedCourse} visible={isVisible} onClose={closePanel} />)}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        onEdgesChange={onEdgesChange}
        defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
        fitView
        key={workspaceKey}
      >
        <Background />
        <Panel position="top-center">
          <SearchBar onCourseChosen={handleSearchSelect}/>
        </Panel>
        <ResponsiveGraph />
      </ReactFlow>
    </div>
    );
}

export default MainWorkspace;
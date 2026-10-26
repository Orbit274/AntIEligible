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
import { ReactFlow, Background, MarkerType, useNodesState, Panel} from "@xyflow/react";
import SearchBar from "./components/SearchBar";
import "@xyflow/react/dist/style.css";
import "./App.css";
import Header from "./components/Header";
import { useState } from "react";
import CourseDetailsPanel from "./components/CourseDetailsPanel";
import CourseNode from "./components/CourseNode";
import ResponsiveGraph from "./components/ResponsiveGraph"
import { BrowserRouter, Route, Routes } from "react-router-dom" 
import CoursePlanner from "./components/CoursePlanner"
import MainWorkspace from "./components/MainWorkspace";
// // Makes one box, so we don't repeat the same fields for every class
// function makeNode(code, x, y) {
//   return {
//     id: code,
//     type: "courseNode",
//     position: { x: x, y: y },
//     depth: 0,
//     left: null,
//     right: null,
//     data: { label: code,
//       status: "not-started"
//     },
//   };
// }


// const nodeTypes = {
//   courseNode : CourseNode,
// }
// //Maps the course node title to the course code in database
// const courseCodeMap = new Map([
//   ["ICS 45J", "I&CSCI45J"],
//   ["ICS 46", "I&CSCI46"],
//   ["ICS 51", "I&CSCI51"],
//   ["ICS 45C", "I&CSCI45C"],
//   ["ICS 6B", "I&CSCI6B"],
//   ["ICS 33", "I&CSCI33"],
//   ["ICS 32", "I&CSCI32"]
// ])
// const startingNodes = [
//   // column 1: your goals
//   makeNode("ICS 45J", 0, 0),
//   makeNode("ICS 46", 0, 150),
//   makeNode("ICS 51", 0, 300),

//   // column 2
//   makeNode("ICS 45C", 300, 75),
//   makeNode("ICS 6B", 300, 250),

//   // column 3
//   makeNode("ICS 33", 600, 75),

//   // column 4
//   makeNode("ICS 32", 900, 75),
// ];

// const edges = [
//   { id: "33-45J", source: "ICS 33", target: "ICS 45J", animated: true},
//   { id: "45C-46", source: "ICS 45C", target: "ICS 46", animated: true},
//   { id: "6B-46", source: "ICS 6B", target: "ICS 46", animated: true },
//   { id: "6B-51", source: "ICS 6B", target: "ICS 51", animated: false},
//   { id: "33-45C", source: "ICS 33", target: "ICS 45C", animated: false },
//   { id: "32-33", source: "ICS 32", target: "ICS 33", animated: false },
// ];

// function nextStatus(status) {
//   if (status === "not-started") return "in-progress";
//   if (status === "in-progress") return "completed";
//   return "not-started";
// }

export default function App() {
//   const [nodes, setNodes, onNodesChange] = useNodesState(startingNodes);
//   const [selectedCourse, setSelectedCourse] = useState(null);
//   const [isVisible, setIsVisible] = useState(false);
//   function handleNodeClick(event, clickedNode) {
//     const courseCode = courseCodeMap.get(clickedNode.id);
//     setSelectedCourse(courseCode);
//     setIsVisible(true);
//     // setNodes(nodes.map((node) =>{
//     //   if(node.id !== clickedNode.id) return node;
//     //   return{...node, data: {...node, status: nextStatus(node.data.status)}}
//     // }))
    
//   }

//   function closePanel(){
//     setIsVisible(false);
//   }
  return (
    <div id="app-page">
      
      <BrowserRouter>
        <Header />

        <Routes>
          <Route path="/" element={<MainWorkspace />}></Route>
          <Route path="/search" element={<MainWorkspace />}></Route>
          <Route path="/planner" element={<CoursePlanner />}></Route>
        </Routes>
      </BrowserRouter>
        {/* <CourseDetailsPanel courseId={selectedCourse} visible={isVisible} onClose={closePanel} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
        fitView
      >
        <Background />
        <Panel position="top-center">
          <SearchBar />
        </Panel>
        <ResponsiveGraph />
      </ReactFlow> */}
    </div>
  );
}
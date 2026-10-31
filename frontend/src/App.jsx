import {
  ReactFlow,
  Background,
  MarkerType,
  useNodesState,
  Panel,
} from "@xyflow/react";
import SearchBar from "./components/SearchBar";
import "@xyflow/react/dist/style.css";
import "./App.css";
import Header from "./components/Header";
import { useState } from "react";
import CourseDetailsPanel from "./components/CourseDetailsPanel";
import CourseNode from "./components/CourseNode";
import ResponsiveGraph from "./components/ResponsiveGraph";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CoursePlanner from "./components/CoursePlanner";
import MainWorkspace from "./components/MainWorkspace";
import SideBarProgressTracker from "./components/SidebarProgressTracker";

export default function App() {
  return (
    <>
      <div id="app-page">
        <BrowserRouter>
          <Header />
          <div id="app-body">
            <SideBarProgressTracker
              completedCourses={[]}
              inprogressCourses={[]}
            />
            <Routes>
              <Route path="/" element={<MainWorkspace />}></Route>
              <Route path="/search" element={<MainWorkspace />}></Route>
              <Route path="/planner" element={<CoursePlanner />}></Route>
            </Routes>
          </div>
        </BrowserRouter>
      </div>
    </>
  );
}

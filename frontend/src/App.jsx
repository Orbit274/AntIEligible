import "@xyflow/react/dist/style.css";
import "./App.css";
import Header from "./components/Header";

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
            <div id="main-container">
              <Routes>
                <Route path="/" element={<MainWorkspace />}></Route>
                <Route path="/search" element={<MainWorkspace />}></Route>
                <Route path="/planner" element={<CoursePlanner />}></Route>
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </div>
    </>
  );
}

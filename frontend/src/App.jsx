import "@xyflow/react/dist/style.css";
import "./App.css";
import Header from "./components/Header";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import CoursePlanner from "./components/CoursePlanner";
import MainWorkspace from "./components/MainWorkspace";
import SideBarProgressTracker from "./components/SidebarProgressTracker";
import { useState } from "react";

export default function App() {
  const [completedCourses, setCompletedCourses] = useState(new Map());
  const [inprogressCourses, setInprogressCourses] = useState(new Map());

  const courseProgress = {
    completed: {
      courses: completedCourses,
      setCourses: setCompletedCourses,
    },
    inprogress: {
      courses: inprogressCourses,
      setCourses: setInprogressCourses,
    },
  };
  console.log(completedCourses);
  return (
    <>
      <div id="app-page">
        <BrowserRouter>
          <Header />
          <div id="app-body">
            <SideBarProgressTracker
              completedCourses={completedCourses}
              inprogressCourses={inprogressCourses}
            />
            <div id="main-container">
              <Routes>
                <Route
                  path="/"
                  element={<MainWorkspace courseProgress={courseProgress} />}
                ></Route>
                <Route
                  path="/search"
                  element={<MainWorkspace courseProgress={courseProgress} />}
                ></Route>
                <Route path="/planner" element={<CoursePlanner />}></Route>
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </div>
    </>
  );
}

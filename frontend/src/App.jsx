import "@xyflow/react/dist/style.css";
import "./App.css";
import Header from "./components/Header";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CoursePlanner from "./components/CoursePlanner";
import MainWorkspace from "./components/MainWorkspace";
import SideBarProgressTracker from "./components/SidebarProgressTracker";
import { useState, useCallback, useEffect } from "react";
import TutorialGuide from "./components/TutorialGuide";
import TipsPanel from "./components/TipsPanel";
import usePersistentMap from "./hooks/usePersistentMap";

// Bump the version when the saved shape changes, so old data is ignored
const COMPLETED_COURSES_KEY = "antieligible.completedCourses.v1";
const INPROGRESS_COURSES_KEY = "antieligible.inprogressCourses.v1";

const TUTORIAL_SEEN_KEY = "antieligible-tutorial-seen";

function AppContent({ courseProgress, completedCourses, inprogressCourses }) {
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  // Show the guided tour automatically on a first visit. The Tutorial button
  // in the header can reopen it whenever someone wants a refresher.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(TUTORIAL_SEEN_KEY) !== "true") {
        setTutorialOpen(true);
      }
    } catch {
      // Storage unavailable, show first visit tutorial
      setTutorialOpen(true);
    }
  }, []);

  const closeTutorial = useCallback(() => {
    setTutorialOpen(false);
    try {
      window.localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    } catch {
      // The tour can still be closed even when browser storage is disabled
    }
  }, []);

  const startTutorial = useCallback(() => {
    setTipsOpen(false);
    setTutorialOpen(true);
  }, []);

  return (
    <>
      <div id="app-page">
        <Header
          onStartTutorial={startTutorial}
          onOpenTips={() => setTipsOpen(true)}
        />
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
              />
              <Route
                path="/search"
                element={<MainWorkspace courseProgress={courseProgress} />}
              />
              <Route path="/planner" element={<CoursePlanner />} />
            </Routes>
          </div>
        </div>
      </div>

      <TutorialGuide
        key={tutorialOpen ? "tutorial-open" : "tutorial-closed"}
        open={tutorialOpen}
        onClose={closeTutorial}
      />
      <TipsPanel open={tipsOpen} onClose={() => setTipsOpen(false)} />
    </>
  );
}

export default function App() {
  const [completedCourses, setCompletedCourses] = usePersistentMap(
    COMPLETED_COURSES_KEY,
  );
  const [inprogressCourses, setInprogressCourses] = usePersistentMap(
    INPROGRESS_COURSES_KEY,
  );

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
  return (
    <BrowserRouter>
      <AppContent
        courseProgress={courseProgress}
        completedCourses={completedCourses}
        inprogressCourses={inprogressCourses}
      />
    </BrowserRouter>
  );
}
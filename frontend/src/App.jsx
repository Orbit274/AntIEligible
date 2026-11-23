import "@xyflow/react/dist/style.css";
import "./App.css";
import Header from "./components/Header";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CoursePlanner from "./components/CoursePlanner";
import MainWorkspace from "./components/MainWorkspace";
import SideBarProgressTracker from "./components/SidebarProgressTracker";
import { useState, useCallback, useEffect, useRef } from "react";
import TutorialGuide from "./components/TutorialGuide";
import TipsPanel from "./components/TipsPanel";
import { TutorialActionProvider } from "./components/TutorialActionContext";

const TUTORIAL_SEEN_KEY = "antieligible-tutorial-seen";

function AppContent({ courseProgress, completedCourses, inprogressCourses }) {
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [searchWorkspaceKey, setSearchWorkspaceKey] = useState(0);
  const tutorialProgressSnapshot = useRef({
    completed: new Map(completedCourses),
    inprogress: new Map(inprogressCourses),
  });

  // Save the current tracker state and restore it when the tour ends
  const restoreTutorialProgress = useCallback(() => {
    const snapshot = tutorialProgressSnapshot.current;
    if (!snapshot) return;

    courseProgress.completed.setCourses(new Map(snapshot.completed));
    courseProgress.inprogress.setCourses(new Map(snapshot.inprogress));
    tutorialProgressSnapshot.current = null;
    setSearchWorkspaceKey((key) => key + 1);
  }, [courseProgress.completed.setCourses, courseProgress.inprogress.setCourses]);

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
    restoreTutorialProgress();
    setTutorialOpen(false);
    try {
      window.localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    } catch {
      // The tour can still be closed even when browser storage is disabled
    }
  }, [restoreTutorialProgress]);

  const startTutorial = useCallback(() => {
    tutorialProgressSnapshot.current = {completed: new Map(completedCourses), inprogress: new Map(inprogressCourses)};
    setTipsOpen(false);
    setTutorialOpen(true);
  }, [completedCourses, inprogressCourses]);

  return (
    <TutorialActionProvider>
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
                element={<MainWorkspace courseProgress={courseProgress} key={searchWorkspaceKey} />}
              />
              <Route
                path="/search"
                element={<MainWorkspace courseProgress={courseProgress} key={searchWorkspaceKey} />}
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
    </TutorialActionProvider>
  );
}

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
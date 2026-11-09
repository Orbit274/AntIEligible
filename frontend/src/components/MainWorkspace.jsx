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
import { useCallback, useEffect, useRef, useState } from "react";
import SearchBar from "./SearchBar";
import CourseNode from "./CourseNode";
import "@xyflow/react/dist/style.css";
import "../styles/MainWorkspace.css";
import axios from "axios";
import ZoomControls from "./ZoomControls";
import GraphLegend from "./GraphLegend";
import {
  buildCourseGraph,
  addCourseToWorkspace,
  addFullTreeToWorkspace,
  removeCourseFromGraph,
} from "../graph/courseGraph";
import LogicNode from "./LogicNode";
import InfoNode from "./InfoNode";
import ViewFocus from "./ViewFocus";
import ResponsiveGraph from "./ResponsiveGraph";
import CourseContext from "./CourseContext";
import { CourseStatus } from "../enums/courseStatus";

const translateExtent = [
  [-1500, -3000],
  [3000, 3000],
];
const nodeTypes = {
  courseNode: CourseNode,
  logicNode: LogicNode,
  infoNode: InfoNode,
};

const STARTING_COURSE_ID = "COMPSCI161";

async function fetchCourse(id) {
  const response = await axios.get(`/api/course/${encodeURIComponent(id)}`);
  return response.data;
}

async function fetchCourseTree(id) {
  const response = await axios.get(
    `/api/course-tree/${encodeURIComponent(id)}`,
  );
  return response.data;
}

function MainWorkspace({ courseProgress }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workspaceKey, setWorkspaceKey] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState("loading");
  const [focusRequest, setFocusRequest] = useState({ ids: [] });
  const [showFullTree, setShowFullTree] = useState(false);
  const flowRef = useRef(null);
  const latestLoad = useRef(0);

  function closePanel() {
    setIsVisible(false);
  }

  // Puts the starting course and its prerequisites on the workspace
  const showStartingCourse = useCallback(
    (course) => {
      const graph = buildCourseGraph(course);
      const appliedCourseStatusGraph = applyCourseStatusFromSidebar(graph, {
        completedCourses: courseProgress.completed.courses,
        inprogressCourses: courseProgress.inprogress.courses,
      });
      setNodes(appliedCourseStatusGraph.nodes);
      setEdges(appliedCourseStatusGraph.edges);
      setWorkspaceKey((key) => key + 1);
      setFocusRequest({ ids: [] });
      setSelectedCourse(null);
      setIsVisible(false);
      setStatus("ready");
    },
    [setNodes, setEdges],
  );
  /**
   * This function apply the course's status from the course tracker to the graph
   * @param graph : the graph that need to be applied status
   * @param param1 : a set of two course collections from course tracker (completed and in-progress collection)
   * @returns new graph with the nodes are applied status
   */
  function applyCourseStatusFromSidebar(
    graph,
    { completedCourses, inprogressCourses },
  ) {
    graph.nodes.forEach((node) => {
      if (completedCourses.has(node.id))
        node.data.status = CourseStatus.COMPLETED;
      if (inprogressCourses.has(node.id))
        node.data.status = CourseStatus.IN_PROGRESS;
    });

    return graph;
  }
  // Fetches the starting course and replaces the whole workspace with it
  async function loadStartingCourse() {
    const thisLoad = ++latestLoad.current;
    try {
      const course = await fetchCourse(STARTING_COURSE_ID);
      if (thisLoad === latestLoad.current) showStartingCourse(course);
    } catch (err) {
      if (thisLoad !== latestLoad.current) return;
      console.error("Failed to load the starting course:", err);
      setStatus("failed");
    }
  }

  // Show the starting course
  useEffect(() => {
    const thisLoad = ++latestLoad.current;
    fetchCourse(STARTING_COURSE_ID)
      .then((course) => {
        if (thisLoad === latestLoad.current) showStartingCourse(course);
      })
      .catch((err) => {
        if (thisLoad !== latestLoad.current) return;
        console.error("Failed to load the starting course:", err);
        setStatus("failed");
      });
  }, [showStartingCourse]);

  // Used by Reset and "Try again", show "Loading..." and load the starting course again
  function reload() {
    setStatus("loading");
    loadStartingCourse();
  }

  function handleReset() {
    if (
      !window.confirm(
        "Reset the workspace? Added courses and progress marks will be cleared.",
      )
    ) {
      return;
    }
    reload();
  }

  function handleNodeClick(event, clickedNode) {
    if (clickedNode.type !== "courseNode") {
      return;
    }
    const courseCode = clickedNode.id;
    setSelectedCourse(courseCode);
    setIsVisible(true);
  }

  // Called by the search bar, adds the course and its prerequisites to the workspace
  async function handleSearchSelect(result) {
    try {
      // Full tree mode gets every prerequisite down the chain, otherwise just the first layer
      const data = showFullTree
        ? await fetchCourseTree(result.id)
        : await fetchCourse(result.id);
      latestLoad.current++;
      const flow = flowRef.current;
      const current = flow
        ? { nodes: flow.getNodes(), edges: flow.getEdges() }
        : { nodes, edges };

      const { graph, focusIds } = showFullTree
        ? addFullTreeToWorkspace(current, data)
        : addCourseToWorkspace(current, data);
      const appliedStatusGraph = applyCourseStatusFromSidebar(graph, {
        completedCourses: courseProgress.completed.courses,
        inprogressCourses: courseProgress.inprogress.courses,
      });
      setNodes(appliedStatusGraph.nodes);
      setEdges(appliedStatusGraph.edges);
      setFocusRequest({ ids: focusIds });
      setStatus("ready");

      setSelectedCourse(data.id);
      setIsVisible(true);
    } catch (err) {
      console.error("Failed to load course:", err);
    }
  }

  // Runs when something is about to be deleted, the delete key on selected nodes, a node's × button
  // We do the deleting ourselves, so that a course takes its own prerequisites with it
  // and then tell React Flow not to delete anything
  async function handleBeforeDelete({ nodes: toDelete }) {
    const courses = toDelete.filter((node) => node.type === "courseNode");
    if (courses.length > 0 && flowRef.current) {
      let graph = {
        nodes: flowRef.current.getNodes(),
        edges: flowRef.current.getEdges(),
      };
      for (const course of courses) {
        graph = removeCourseFromGraph(graph, course.id);
      }
      setNodes(graph.nodes);
      setEdges(graph.edges);
      if (courses.some((course) => course.id === selectedCourse)) {
        setIsVisible(false);
        setSelectedCourse(null);
      }
    }
    return false;
  }

  const completedCourses = courseProgress.completed.courses;
  const inprogressCourses = courseProgress.inprogress.courses;

  /**
   * Handle adding and removing courses from the sidebar when the course's status is changed directly on the graph
   * @param course : course node
   */
  function handleSideBarCourse(course) {
    if (course.data.status === CourseStatus.COMPLETED) {
      removeCourseFromSideBar(course.id, CourseStatus.IN_PROGRESS);
      addCourseToSideBar(course, CourseStatus.COMPLETED);
    }
    if (course.data.status === CourseStatus.IN_PROGRESS) {
      removeCourseFromSideBar(course.id, CourseStatus.COMPLETED);
      addCourseToSideBar(course, CourseStatus.IN_PROGRESS);
    }
    if (course.data.status === CourseStatus.NOT_STARTED) {
      removeCourseFromSideBar(course.id, CourseStatus.IN_PROGRESS);
      removeCourseFromSideBar(course.id, CourseStatus.COMPLETED);
    }
  }

  /** 
    Add the course to course collection on course tracker sidebar. The not-started status would not be tracked
    There are two collections: completed course and in-progress course collections
    @param course: course node
    @param status: status of course node which node is changing to (completed or in progress)
  */
  function addCourseToSideBar(course, status) {
    if (status === CourseStatus.COMPLETED && !completedCourses.has(course.id)) {
      courseProgress.completed.setCourses((completedCourses) => {
        const newCompletedCourses = new Map(completedCourses);
        newCompletedCourses.set(course.id, course.data.label);
        return newCompletedCourses;
      });
    }
    if (
      status === CourseStatus.IN_PROGRESS &&
      !inprogressCourses.has(course.id)
    ) {
      courseProgress.inprogress.setCourses((inprogressCourses) => {
        const newInprogressCourses = new Map(inprogressCourses);
        newInprogressCourses.set(course.id, course.data.label);
        return newInprogressCourses;
      });
    }
  }

  /**
   * Remove a course from course tracker sidebar.
   * @param courseId: course id
   * @param status: status of course node which node is changing from
   */
  function removeCourseFromSideBar(courseId, status) {
    if (status === CourseStatus.COMPLETED && completedCourses.has(courseId)) {
      courseProgress.completed.setCourses((completedCourses) => {
        const newCompletedCourses = new Map(completedCourses);
        newCompletedCourses.delete(courseId);
        return newCompletedCourses;
      });
    }

    if (
      status === CourseStatus.IN_PROGRESS &&
      inprogressCourses.has(courseId)
    ) {
      courseProgress.inprogress.setCourses((inprogressCourses) => {
        const newInprogressCourse = new Map(inprogressCourses);
        newInprogressCourse.delete(courseId);
        return newInprogressCourse;
      });
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
            <button
              className="tree-toggle"
              onClick={() => setShowFullTree((full) => !full)}
            >
              {showFullTree ? "Full tree" : "First layer"}
            </button>
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
                <CourseContext.Provider
                  value={{
                    handleSideBarCourse,
                    courseProgress,
                    applyCourseStatusFromSidebar,
                  }}
                >
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
                      markerEnd: {
                        type: MarkerType.ArrowClosed,
                      },
                    }}
                    fitView
                    key={workspaceKey}
                    onInit={(instance) => {
                      flowRef.current = instance;
                    }}
                    onBeforeDelete={handleBeforeDelete}
                    deleteKeyCode={["Backspace", "Delete"]}
                  >
                    <Background />
                    <Panel position="bottom-center">
                      {status === "loading" && (
                        <div className="workspace-message">Loading...</div>
                      )}
                      {status === "failed" && (
                        <div className="workspace-message">
                          Couldn't load the starting course. Is the backend
                          running?
                          <button onClick={reload}>Try again</button>
                        </div>
                      )}
                      {status === "ready" && nodes.length === 0 && (
                        <div className="workspace-message">
                          Search for a class to add it to the workspace.
                        </div>
                      )}
                    </Panel>
                    <ViewFocus request={focusRequest} />
                    <ResponsiveGraph />
                  </ReactFlow>
                </CourseContext.Provider>
              </div>
            </ReactFlowProvider>
            <button className="reset-button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default MainWorkspace;

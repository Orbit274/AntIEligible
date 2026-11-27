import CourseDetailsPanel from "./CourseDetailsPanel";
import {
  ReactFlow,
  Background,
  MarkerType,
  useNodesState,
  Panel,
  useEdgesState,
  ReactFlowProvider,
  getNodesBounds,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "./SearchBar";
import CourseNode from "./CourseNode";
import "@xyflow/react/dist/style.css";
import "../styles/MainWorkspace.css";
import axios from "axios";
import ZoomControls from "./ZoomControls";
import GraphLegend from "./GraphLegend";
import {
  addCourseToWorkspace,
  addFullTreeToWorkspace,
  courseIdOf,
  removeCourseFromGraph,
} from "../graph/courseGraph";
import LogicNode from "./LogicNode";
import InfoNode from "./InfoNode";
import ViewFocus from "./ViewFocus";
import ResponsiveGraph from "./ResponsiveGraph";
import GraphScrollbars from "./GraphScrollbars";
import CourseContext from "./CourseContext";
import { CourseStatus } from "../enums/courseStatus";
import { useTutorialActions } from "./TutorialActionContext";
import {
  Orientation,
  convertOrientation,
  layoutIn,
} from "../graph/orientation";
import {
  loadOrientation,
  loadSavedGraph,
  saveGraph,
  saveOrientation,
} from "../storage/graphStorage";

// How far past the outermost nodes you can pan, same on every side
const PAN_PADDING = 200;

const nodeTypes = {
  courseNode: CourseNode,
  logicNode: LogicNode,
  infoNode: InfoNode,
};

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
  // The graph saved in the last visit with the sidebar's statuses applied, null when there is none.
  // Its positions are in the saved orientation, which loadOrientation restores alongside it.
  const [restoredGraph] = useState(() => {
    const savedGraph = loadSavedGraph();
    return (
      savedGraph &&
      applyCourseStatusFromSidebar(savedGraph, {
        completedCourses: courseProgress.completed.courses,
        inprogressCourses: courseProgress.inprogress.courses,
      })
    );
  });
  const [nodes, setNodes, onNodesChange] = useNodesState(
    restoredGraph?.nodes ?? [],
  );
  // Panning stops a little past the nodes in every direction, GraphScrollbars reads this same box
  const translateExtent = useMemo(() => {
    if (nodes.length === 0) {
      return [
        [-PAN_PADDING, -PAN_PADDING],
        [PAN_PADDING, PAN_PADDING],
      ];
    }
    const bounds = getNodesBounds(nodes);
    return [
      [bounds.x - PAN_PADDING, bounds.y - PAN_PADDING],
      [bounds.x + bounds.width + PAN_PADDING, bounds.y + bounds.height + PAN_PADDING],
    ];
  }, [nodes]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    restoredGraph?.edges ?? [],
  );
  const [workspaceKey, setWorkspaceKey] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [focusRequest, setFocusRequest] = useState({ ids: [] });
  const [showFullTree, setShowFullTree] = useState(false);
  const [orientation, setOrientation] = useState(loadOrientation);
  // Always the current orientation. Async handlers read this after their fetch
  // (the state value they captured may be stale if the user switched meanwhile),
  const orientationRef = useRef(orientation);
  const getOrientation = useCallback(() => orientationRef.current, []);
  const flowRef = useRef(null);
  const graphNodeDragStart = useRef(null);
  const { reportTutorialAction } = useTutorialActions();

  function closePanel() {
    if (!isVisible) return;

    setIsVisible(false);
    if (selectedCourse) {
      reportTutorialAction("course-details-closed", { courseId: selectedCourse });
    }
  }

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
      if (completedCourses.has(courseIdOf(node)))
        node.data.status = CourseStatus.COMPLETED;
      if (inprogressCourses.has(courseIdOf(node)))
        node.data.status = CourseStatus.IN_PROGRESS;
    });

    return graph;
  }
  // Save the graph after every change so it survives a page refresh.
  // Skipped while a node is being dragged, so it is written once on drop instead of every frame.
  useEffect(() => {
    if (nodes.some((node) => node.dragging)) return;
    saveGraph({ nodes, edges });
  }, [nodes, edges]);

  // Clears the workspace back to an empty graph
  function handleReset() {
    if (!window.confirm("Reset the workspace? Every course on the graph will be removed.")) {
      return;
    }
    setNodes([]);
    setEdges([]);
    setFocusRequest({ ids: [] });
    setSelectedCourse(null);
    setIsVisible(false);
    setWorkspaceKey((key) => key + 1);
  }

  function handleNodeClick(event, clickedNode) {
    if (clickedNode.type !== "courseNode") {
      return;
    }
    const courseCode = courseIdOf(clickedNode);
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
      const flow = flowRef.current;
      const current = flow
        ? { nodes: flow.getNodes(), edges: flow.getEdges() }
        : { nodes, edges };

      // Layout runs left-to-right (new trees go below), so in top-down they land to the right.
      // Read the orientation now, not from before the fetch: `current` is drawn in it.
      let focusIds = [];
      const graph = layoutIn(getOrientation(), current, (ltr) => {
        const result = showFullTree
          ? addFullTreeToWorkspace(ltr, data)
          : addCourseToWorkspace(ltr, data);
        focusIds = result.focusIds;
        return result.graph;
      });
      const appliedStatusGraph = applyCourseStatusFromSidebar(graph, {
        completedCourses: courseProgress.completed.courses,
        inprogressCourses: courseProgress.inprogress.courses,
      });
      setNodes(appliedStatusGraph.nodes);
      setEdges(appliedStatusGraph.edges);
      setFocusRequest({ ids: focusIds });

      setSelectedCourse(data.id);
      setIsVisible(true);
      reportTutorialAction("graph-course-selected", { courseId: data.id });
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
      if (courses.some((course) => courseIdOf(course) === selectedCourse)) {
        setIsVisible(false);
        setSelectedCourse(null);
      }
    }
    return false;
  }

  // Redraws the whole graph in the other orientation. React Flow is remounted
  // (new key) so every handle is re-measured on its new side, and fitView on
  // mount fits the whole rotated graph.
  function changeOrientation(next) {
    if (next === orientation) return;
    const flow = flowRef.current;
    const current = flow
      ? { nodes: flow.getNodes(), edges: flow.getEdges() }
      : { nodes, edges };
    const converted = convertOrientation(current, orientation, next);
    orientationRef.current = next;
    setOrientation(next);
    saveOrientation(next);
    setNodes(converted.nodes);
    setEdges(converted.edges);
    setFocusRequest({ ids: [] });
    setWorkspaceKey((key) => key + 1);
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
          <div id="search-bar-container" data-tour="course-search-tools">
            <SearchBar onCourseChosen={handleSearchSelect} tourTarget="course-search-input" tourResultTarget="course-search-result" tourContext="graph"/>
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
            <div id="graph-column">
            <div
              className="orientation-toggle"
              role="group"
              aria-label="Graph direction"
            >
              {[
                [Orientation.LEFT_TO_RIGHT, "Left to right"],
                [Orientation.TOP_DOWN, "Top down"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={orientation === value ? "active" : ""}
                  aria-pressed={orientation === value}
                  onClick={() => changeOrientation(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div id="graph-card" data-tour="graph-canvas">
              <ReactFlowProvider>
                <ZoomControls />
                <div id="graph">
                  <CourseContext.Provider
                    value={{
                      handleSideBarCourse,
                      courseProgress,
                      applyCourseStatusFromSidebar,
                      orientation,
                      getOrientation,
                    }}
                  >
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      nodeTypes={nodeTypes}
                      onNodesChange={onNodesChange}
                      onNodeClick={handleNodeClick}
                      onNodeDragStart={(_, node) => {
                        if (node.type === "courseNode") {
                          graphNodeDragStart.current = {
                            id: node.id,
                            x: node.position.x,
                            y: node.position.y,
                          };
                        }
                      }}
                      onNodeDragStop={(_, node) => {
                        const start = graphNodeDragStart.current;
                        graphNodeDragStart.current = null;
                        if (
                          node.type === "courseNode" &&
                          start?.id === node.id &&
                          (Math.abs(start.x - node.position.x) > 1 || Math.abs(start.y - node.position.y) > 1)
                        ) {
                          reportTutorialAction("graph-course-node-moved", { courseId: courseIdOf(node) });
                        }
                      }}
                      onMoveEnd={(event) => {
                        if (event) {
                          reportTutorialAction("graph-canvas-panned");
                        }
                      }}
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
                      panOnScroll
                      zoomOnScroll={false}
                    >
                      <Background />
                      <Panel position="bottom-center">
                        {nodes.length === 0 && (
                          <div className="workspace-message">
                            Search for a class to add it to the workspace.
                          </div>
                        )}
                      </Panel>
                      <ViewFocus request={focusRequest} />
                      <GraphScrollbars />
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
            <GraphLegend orientation={orientation} />
          </div>
        </div>
      </div>
    </>
  );
}

export default MainWorkspace;
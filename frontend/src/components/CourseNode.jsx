import {
  Handle,
  Position,
  useReactFlow,
  useNodes,
  useEdges,
} from "@xyflow/react";
import "../styles/CourseNode.css";
// import { useCallback, useState } from "react";
import axios from "axios";
import {
  addCourseToGraph,
  removePrereqCourseNode,
} from "../graph/courseGraph.js";
import {
  countMissingPrerequisites,
  getMissingPrerequisites,
} from "../graph/eligibilityCheck.js";
import { CourseStatus } from "../enums/courseStatus.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCourseContext } from "./CourseContext.jsx";
import ProgressSelection from "./ProgressSelection.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
function CourseNode({ id, data }) {
  const {
    updateNodeData,
    getEdges,
    getNodes,
    setNodes,
    setEdges,
    getNode,
    deleteElements,
  } = useReactFlow();
  const { handleSideBarCourse, courseProgress, applyCourseStatusFromSidebar } =
    useCourseContext();

  // Subscribe to the live graph so the eligibility count recomputes whenever
  // any prerequisite's status changes.
  const nodes = useNodes();
  const edges = useEdges();
  const missingCount = useMemo(
    () => countMissingPrerequisites(id, { nodes, edges }),
    [id, nodes, edges],
  );
  const missingList = useMemo(
    () => getMissingPrerequisites(id, { nodes, edges }),
    [id, nodes, edges],
  );

  // A completed course shows "Completed" and an in-progress one "In-progress",
  // both regardless of prerequisites; otherwise it is "Eligible" when nothing is
  // missing, or the missing count.
  let eligibilityClass, eligibilityLabel;
  if (data.status === CourseStatus.COMPLETED) {
    eligibilityClass = "completed";
    eligibilityLabel = "Completed";
  } else if (data.status === CourseStatus.IN_PROGRESS) {
    eligibilityClass = "in-progress";
    eligibilityLabel = "In-progress";
  } else if (missingCount === 0) {
    eligibilityClass = "eligible";
    eligibilityLabel = "Eligible";
  } else {
    eligibilityClass = "missing";
    eligibilityLabel = `Still missing: ${missingCount}`;
  }

  const [showSelecteOption, setShowSelectOption] = useState(false);
  const [confirmForceOpen, setConfirmForceOpen] = useState(false);
  const tabRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (tabRef.current && !tabRef.current.contains(event.target)) {
        setShowSelectOption(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const branchToggleAction = data.isExpanded ? "collapse" : "expand";
  function handleChangeStatus(event) {
    event.stopPropagation();
    setShowSelectOption(!showSelecteOption);
  }

  function handleDelete(event) {
    event.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  }
  async function fetchCurrentCourseById(id) {
    try {
      const response = await axios.get(`/api/course/${encodeURIComponent(id)}`);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch prerequisite courses!", err);
      return null;
    }
  }
  async function expandToggleHandler() {
    const course = await fetchCurrentCourseById(id);
    const thisNode = getNode(id);
    if (!course || !thisNode) return;
    const graph = addCourseToGraph(
      { nodes: getNodes(), edges: getEdges() },
      course,
      { x: thisNode.position.x, y: thisNode.position.y },
    );
    const appliedCourseStatusGraph = applyCourseStatusFromSidebar(graph, {
      completedCourses: courseProgress.completed.courses,
      inprogressCourses: courseProgress.inprogress.courses,
    });
    setEdges(appliedCourseStatusGraph.edges);
    setNodes(appliedCourseStatusGraph.nodes);
  }
  function collapseToggleHandler() {
    const graph = removePrereqCourseNode(
      { nodes: getNodes(), edges: getEdges() },
      id,
    );
    setEdges(graph.edges);
    setNodes(
      graph.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, isExpanded: false } }
          : node,
      ),
    );
  }
  function handleBranchToggle(event) {
    event.stopPropagation();

    if (data.isExpanded) {
      collapseToggleHandler();
    } else {
      expandToggleHandler();
    }
  }

  function applyStatus(status) {
    updateNodeData(id, {
      status: status,
    });
    handleSideBarCourse({ id, data: { ...data, status: status } });
  }

  function handleSelectStatusOption(status) {
    setShowSelectOption(false);
    // Confirm only when newly completing a course that still has missing
    // prerequisites. A course that is already completed re-confirms silently.
    if (
      status === CourseStatus.COMPLETED &&
      data.status !== CourseStatus.COMPLETED &&
      missingCount > 0
    ) {
      setConfirmForceOpen(true);
      return;
    }
    applyStatus(status);
  }
  return (
    <div key={id} className={`course-node-container ${data.status}`}>
      <Handle type="target" position={Position.Right} />
      <div className="node" ref={tabRef}>
        <div className="node-course-title-container">
          <span id="course-id">{data.label}</span>
        </div>
        <button className="progress nodrag nopan" onClick={handleChangeStatus}>
          <img src={`../images/${data.status}-status.png`}></img>
        </button>
        <button className="branch-toggle" onClick={handleBranchToggle}>
          <img src={`/images/${branchToggleAction}-branch-arrow.png`}></img>
        </button>
      </div>
      <div className={`node-eligibility ${eligibilityClass}`}>
        {eligibilityLabel}
      </div>
      {showSelecteOption && (
        <ProgressSelection
          handleSelectStatusOption={handleSelectStatusOption}
        />
      )}
      <button
        className="delete-node nodrag nopan"
        title="Remove from workspace"
        aria-label={`Remove ${data.label}`}
        onClick={handleDelete}
      >
        ×
      </button>
      <ConfirmDialog
        open={confirmForceOpen}
        title="Prerequisites still missing"
        message={`${data.label} still has ${missingCount} prerequisite${missingCount === 1 ? "" : "s"} missing. Mark it completed anyway?`}
        details={missingList}
        confirmLabel="Force complete"
        cancelLabel="Cancel"
        onConfirm={() => {
          setConfirmForceOpen(false);
          applyStatus(CourseStatus.COMPLETED);
        }}
        onCancel={() => setConfirmForceOpen(false)}
      />
      <Handle type="source" position={Position.Left} />
    </div>
  );
}

export default CourseNode;

import { Handle, Position, useReactFlow } from "@xyflow/react";
import "../styles/LogicNode.css";
import { useCourseContext } from "./CourseContext.jsx";
import { Orientation } from "../graph/orientation.js";
import { courseIdOf } from "../graph/courseGraph.js";

// Box for a prerequisite that isn't a course (an exam, or something not in the
// course data). The student ticks the checkbox once they have it; that status
// feeds the eligibility count on the courses that depend on it.
function InfoNode({ id, data }) {
  const { setNodes } = useReactFlow();
  const topDown = useCourseContext()?.orientation === Orientation.TOP_DOWN;
  const satisfied = data.satisfied === true;
  const hint = data.kind === "exam" ? "Exam score" : "Not in course data";

  function toggleSatisfied(event) {
    event.stopPropagation();
    // The same exam can be on the graph in several trees, tick all of them
    const examId = courseIdOf({ id, data });
    setNodes((nodes) =>
      nodes.map((node) =>
        courseIdOf(node) === examId
          ? { ...node, data: { ...node.data, satisfied: !satisfied } }
          : node,
      ),
    );
  }

  return (
    <div className={`info-node ${data.kind} ${satisfied ? "satisfied" : ""}`} title={hint}>
      <input
        type="checkbox"
        className="info-node-check nodrag nopan"
        checked={satisfied}
        onChange={toggleSatisfied}
        title={satisfied ? "Mark as not satisfied" : "Mark as satisfied"}
      />
      <span>{data.label}</span>
      <Handle type="source" position={topDown ? Position.Top : Position.Left} />
    </div>
  );
}

export default InfoNode;

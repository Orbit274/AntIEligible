import { Handle, Position, useReactFlow } from "@xyflow/react";
import "../styles/LogicNode.css";

// Box for a prerequisite that isn't a course (an exam, or something not in the
// course data). The student ticks the checkbox once they have it; that status
// feeds the eligibility count on the courses that depend on it.
function InfoNode({ id, data }) {
  const { updateNodeData } = useReactFlow();
  const satisfied = data.satisfied === true;
  const hint = data.kind === "exam" ? "Exam score" : "Not in course data";

  function toggleSatisfied(event) {
    event.stopPropagation();
    updateNodeData(id, { satisfied: !satisfied });
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
      <Handle type="source" position={Position.Left} />
    </div>
  );
}

export default InfoNode;

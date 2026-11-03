import {Handle, Position} from "@xyflow/react";
import "../styles/LogicNode.css";

// Box for prerequisite that isn't a course
function infoNode({data}) {
    const hint = data.kind === "exam" ? "Exam score" : "Not in course data";
    return (
        <div className={`info-node ${data.kind}`} title={hint}>
            <span>{data.label}</span>
            <Handle type="source" position={Position.Left}/>
        </div>
    );
}

export default infoNode;
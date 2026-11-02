import { Handle, Position } from "@xyflow/react";
import "../styles/LogicNode.css";

// The small "OR" circle, dashed lines coming in are the options, and the single solid line leaving it goes to the course
function LogicNode({ data }) {
    return (
        <div className="logic-node" title="Any one of these is enough">
            <Handle type="target" position={Position.Right} />
            <span>{data.label}</span>
            <Handle type="source" position={Position.Left} />
        </div>
    );
}

export default LogicNode;
import { Handle, Position } from "@xyflow/react";
import "../styles/LogicNode.css";
import { useCourseContext } from "./CourseContext.jsx";
import { Orientation } from "../graph/orientation.js";

// The small "OR" circle, dashed lines coming in are the options, and the single solid line leaving it goes to the course
function LogicNode({ data }) {
    const topDown = useCourseContext()?.orientation === Orientation.TOP_DOWN;
    return (
        <div className="logic-node" title="Any one of these is enough">
            <Handle type="target" position={topDown ? Position.Bottom : Position.Right} />
            <span>{data.label}</span>
            <Handle type="source" position={topDown ? Position.Top : Position.Left} />
        </div>
    );
}

export default LogicNode;
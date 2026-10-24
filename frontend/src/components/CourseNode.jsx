import { Handle, Position, useReactFlow } from "@xyflow/react";
import "../styles/CourseNode.css"
import { useState } from "react";
function CourseNode({id, data}){
    const {updateNodeData} = useReactFlow();
    const [isExpanded, setIsExpand] = useState(false);
    const [branchToggleAction, setBranchToggleAction] = useState("expand");
    function handleChangeStatus(event){
        event.stopPropagation();

        updateNodeData(id, {
            status: nextStatus(data.status)
        })
    }
    function handleBranchToggle(event){
        event.stopPropagation();
        setBranchToggleAction(isExpanded ? "collapse" : "expand");
        setIsExpand(!isExpanded);
    }
    return (
        <div className={`course-node-container ${data.status}`} >
            <Handle type="target" position={Position.Right}/>
            <div className="node">
                <span id="course-id">{id}</span>
                <button className="progress nodrag nopan" onClick={handleChangeStatus}><img src={`../images/${data.status}-status.png`}></img></button>
                <button className="branch-toggle" onClick={handleBranchToggle}><img src={`/images/${branchToggleAction}-branch-arrow.png`}></img></button>
            </div>
            <Handle type="source" position={Position.Left}/>
        </div>
    );
}
function nextStatus(status){
    if(status === "not-started") return "in-progress";
    if(status === "in-progress") return "completed";
    return "not-started";
}

export default CourseNode;
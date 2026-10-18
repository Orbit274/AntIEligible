import { Handle, Position, useReactFlow } from "@xyflow/react";
import "../styles/CourseNode.css"
function CourseNode({id, data}){
    const {updateNodeData} = useReactFlow();
    function handleChangeStatus(event){
        event.stopPropagation();

        updateNodeData(id, {
            status: nextStatus(data.status)
        })
    }
    return (
        <div className={`course-node-container ${data.status}`} >
            <Handle type="target" position={Position.Right}/>
            <div className="node">
                <button className="progress nodrag nopan" onClick={handleChangeStatus}><img src={`../images/${data.status}-status.png`}></img></button>
                <span id="course-id">{id}</span>
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
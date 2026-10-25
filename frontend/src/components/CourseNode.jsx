import { Handle, Position, useReactFlow } from "@xyflow/react";
import "../styles/CourseNode.css"
import { useState } from "react";
import axios from "axios";
import "../graph/courseGraph.js"
import { addCourseToGraph} from "../graph/courseGraph.js";
function CourseNode({id, data}){
    const {updateNodeData, getEdges, getNodes, setNodes, setEdges, getNode} = useReactFlow();
    const [branchToggleAction, setBranchToggleAction] = useState(data.isExpanded ? "collapse" : "expand");
    function handleChangeStatus(event){
        event.stopPropagation();

        updateNodeData(id, {
            status: nextStatus(data.status)
        })
    }
    async function fetchCurrentCourseById(id){
        try{
            const response = await axios.get(`/api/course/${encodeURIComponent(id)}`);
            return response.data;
        } catch (err){
            console.error("Failed to fetch prerequisite courses!", err);
            return null;
        }
    }
    async function expandToggleHandler(){
        const course = await fetchCurrentCourseById(id);
        const thisNode = getNode(id);
        if(!course) return;
        const graph = addCourseToGraph({nodes: getNodes(), edges: getEdges()}, course, {x: thisNode.position.x, y: thisNode.position.y});
        setEdges(graph.edges);
        setNodes(graph.nodes);
        
    }
    function handleBranchToggle(event){
        event.stopPropagation();
        const isExpanded = !data.isExpanded;
        updateNodeData(id, {isExpanded : isExpanded});
        setBranchToggleAction(isExpanded? "collapse" : "expand");
        
        if(!data.isExpanded){
            expandToggleHandler();
        }
    }
    
    return (
        <div key={id} className={`course-node-container ${data.status}`} >
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
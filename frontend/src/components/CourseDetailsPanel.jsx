import "../styles/CourseDetailsPanel.css";
import CourseDetails from "./CourseDetails.jsx"
function CourseDetailsPanel({courseId, visible, onClose}){
    return (
        <div id="course-detail-panel" className={visible ? "show" : "close"}>
            <button id="course-detail-close-button" onClick={onClose}><img src="../images/right-arrow.png"></img></button>
            {courseId !== null && visible ? <CourseDetails courseId={courseId} /> : ""}
        </div>
    );
}

export default CourseDetailsPanel;
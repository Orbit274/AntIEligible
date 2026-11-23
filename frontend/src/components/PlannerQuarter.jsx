import PlannerCourse from "./PlannerCourse";
import { useState} from "react";
import { COURSE_DRAG_TYPE } from "../planner/dragAndDrop";

// One quarter of one year, heading and the classes planned for it
// It starts small and grows as classes are added
function PlannerQuarter({yearId, term, courses, selectedId, onOpenCourse, onRemoveCourse, onCourseDrop, onCourseDragStart}) {
    const [isDragOver, setIsDragOver] = useState(false);

    function isCourseDrag(event) {
        return Array.from(event.dataTransfer.types).includes(COURSE_DRAG_TYPE);
    }

    function handleDragOver(event) {
        if (!isCourseDrag(event)) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed === "move" ? "move" : "copy";
    }

    function handleDragEnter(event) {
        if (!isCourseDrag(event)) {
            return;
        }
        event.preventDefault();
        setIsDragOver(true);
    }

    function handleDragLeave(event) {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragOver(false);
        }
    }

    function handleDrop(event) {
        if (!isCourseDrag(event)) {
            return;
        }
        event.preventDefault();
        setIsDragOver(false);
        onCourseDrop(event, yearId, term);
    }

    return (
        <div 
            className={isDragOver ? "quarter drag-over" : "quarter"}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-tour={yearId === 1 && term === "Fall" ? "planner-drop-target" : yearId === 1 && term === "Winter" ? "planner-move-target" : undefined}
        >
            <div className="quarter-header">
                <span className="quarter-term">{term}</span>
            </div>
            <div className="planner-course-container">
                {courses.length === 0 && <span className="planned-empty">No classes yet</span>}
                {courses.map((course) => (
                    <PlannerCourse 
                        key={course.id} 
                        course={course} 
                        selected={course.id === selectedId} 
                        onOpen={onOpenCourse} 
                        onRemove={onRemoveCourse} 
                        onCourseDragStart={onCourseDragStart}
                    />
                ))}
            </div>
        </div>
    );
}

export default PlannerQuarter;
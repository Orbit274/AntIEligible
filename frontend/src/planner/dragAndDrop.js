export const COURSE_DRAG_TYPE = "application/x-uci-course";

// Called when a course search result starts being dragged
export function writeDraggedCourse(event, course, effectAllowed = "copy") {
    event.dataTransfer.effectAllowed = effectAllowed;
    event.dataTransfer.setData(COURSE_DRAG_TYPE, JSON.stringify(course));
}

// Read and validate the course when it is dropped on a planner quarter
export function readDraggedCourse(event) {
    const payload = event.dataTransfer.getData(COURSE_DRAG_TYPE);
    if (!payload) {
        return null;
    }
    try {
        const course = JSON.parse(payload);
        if (!course || typeof course.id !== "string") {
            return null;
        }
        return course;
    } catch {
        return null;
    }
}
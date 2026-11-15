// One class inside a quarter which has its code, title, and units, with a small × to take it out of the plan
function PlannerCourse({course, selected, onOpen, onRemove}) {
    return (
        <div className={selected ? "planner-course selected" : "planner-course"}>
            <button className="planner-course-open" onClick={() => onOpen(course)}>
                <strong>{course.label}</strong>
                <span>{course.title}</span>
                <span className="planned-units">{course.units}</span>
            </button>
            <button className="remove-course" aria-label={`Remove ${course.label}`} onClick={() => onRemove(course.id)}>
            ×
            </button>
        </div>
    );
}

export default PlannerCourse;
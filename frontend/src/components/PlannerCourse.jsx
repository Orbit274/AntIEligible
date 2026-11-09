// One class inside a quarter whichhas its code, title, and units, with a small × to take it out of the plan
function PlannerCourse({course, onRemove}) {
    return (
        <div className="planned-course">
            <button className="remove-course" aria-label={`Remove ${course.label}`} onClick={() => onRemove(course.id)}>
            ×
            </button>
            <strong>{course.label}</strong>
            <span>{course.title}</span>
            <span className="planned-units">{course.units}</span>
        </div>
    );
}

export default PlannerCourse;
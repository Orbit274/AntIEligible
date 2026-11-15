import PlannerCourse from "./PlannerCourse";

// One quarter of one year, heading and the classes planned for it
// It starts small and grows as classes are added
function PlannerQuarter({term, courses, selectedId, onOpenCourse, onRemoveCourse}) {
    return (
        <div className="quarter">
            <div className="quarter-header">
                <span className="quarter-term">{term}</span>
            </div>
            <div className="planner-course-container">
                {courses.length === 0 && <span className="planned-empty">No classes yet</span>}
                {courses.map((course) => (
                    <PlannerCourse key={course.id} course={course} selected={course.id === selectedId} onOpen={onOpenCourse} onRemove={onRemoveCourse} />
                ))}
            </div>
        </div>
    );
}

export default PlannerQuarter;
import PlannerCourse from "./PlannerCourse";

// One quarter of one year, heading and the classes planned for it
// It starts small and grows as classes are added
function PlannerQuarter({term, courses, onRemoveCourse}) {
    return (
        <div className="quarter">
            <span className="quarter-term">{term}</span>
            <div className="planned-course-container">
                {courses.length === 0 && <span className="planned-empty">No classes yet</span>}
                {courses.map((course) => (
                    <PlannerCourse key={course.id} course={course} onRemove={onRemoveCourse} />
                ))}
            </div>
        </div>
    );
}

export default PlannerQuarter;
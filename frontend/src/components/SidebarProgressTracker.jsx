import "../styles/SidebarProgressTracker.css";
function SideBarProgressTracker({ completedCourses, inprogressCourses }) {
  return (
    <div id="sidebar-container">
      <span id="sidebar-title">
        Course Tracker <br />
      </span>
      <span className="side-bar-label">Completed Courses</span>
      <CourseList courseList={completedCourses} />
      <hr></hr>
      <span className="side-bar-label">In-progress Courses</span>
      <CourseList courseList={inprogressCourses} />
    </div>
  );
}

function CourseList({ courseList }) {
  return (
    <div className="tracked-course-container">
      {courseList.length > 0 ? (
        coursesList.map((course) => (
          <div key={course.id} className="tracked-course">
            {course.label}
          </div>
        ))
      ) : (
        <span id="empty-tracked-course-notice">Empty...</span>
      )}
    </div>
  );
}

export default SideBarProgressTracker;

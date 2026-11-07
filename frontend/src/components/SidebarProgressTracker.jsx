import "../styles/SidebarProgressTracker.css";
function SideBarProgressTracker({ completedCourses, inprogressCourses }) {
  return (
    <div id="sidebar-container">
      <span id="sidebar-title">
        Course Tracker <br />
      </span>
      <hr></hr>
      <div className="sidebar-label-container">
        <span className="sidebar-label">Completed Courses</span>
        <span className="course-counter">{completedCourses.size}</span>
      </div>
      <CourseList courseList={completedCourses} status={"completed"} />

      <hr></hr>

      <div className="sidebar-label-container">
        <span className="sidebar-label">In-progress Courses</span>
        <span className="course-counter">{inprogressCourses.size}</span>
      </div>
      <CourseList courseList={inprogressCourses} status={"in-progress"} />
    </div>
  );
}

function CourseList({ courseList, status }) {
  return (
    <div className="tracked-course-container">
      {courseList.size > 0 ? (
        [...courseList].map(([key, value]) => (
          <div key={key} className={`tracked-course ${status}`}>
            {value}
          </div>
        ))
      ) : (
        <span id="empty-tracked-course-notice">Empty...</span>
      )}
    </div>
  );
}

export default SideBarProgressTracker;

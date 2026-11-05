import "../styles/SidebarProgressTracker.css";
function SideBarProgressTracker({ completedCourses, inprogressCourses }) {
  return (
    <div id="sidebar-container">
      <span id="sidebar-title">
        Course Tracker <br />
      </span>
      <span className="side-bar-label">Completed Courses</span>
      <CourseList courseList={completedCourses} status={"completed"} />
      <hr></hr>
      <span className="side-bar-label">In-progress Courses</span>
      <CourseList courseList={inprogressCourses}  status={"in-progress"}/>
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

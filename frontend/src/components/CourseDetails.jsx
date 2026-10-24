import axios from "axios"
import { useEffect, useState } from "react";
import "../styles/CourseDetails.css"

function CourseDetails({courseId}){
        const [course, setCourse] = useState(null);
        const [error, setError] = useState(null);
        useEffect(() =>{
            async function fetchCourse(){
                try {
                    setError(null);
                    const response = await axios.get(`/api/course/${encodeURIComponent(courseId)}`);
                    setCourse(response.data)
                } catch (err){
                    console.error("Failed to fetch course:", err);
                    setError("Failed to load course details.");
                }
            }
            
            fetchCourse();
        }, [courseId])

        if (error) return <div>{error}</div>;
        if (!course) return <div>Loading course details...</div>;
        const prereqCourses = loadPrerequisites(course.prerequisites)
    return (
        <div id="course-details-container">
            <div id="course-detail-header">
                <h2>{course === null ? "" : course.title} </h2>
            </div>

            <div id="course-info">
                <div className="label-container">
                    <span className="label">Course ID:</span>
                    <span>{course.id}</span>
                </div>
                <div className="label-container">
                    <span className="label">Deparment:</span>
                    <span>{course.department}</span>
                </div>
                <div className="label-container">
                    <span className="label">Department Name:</span>
                    <span>{course.department_name} </span>
                </div>
                <div className="label-container">
                    <span className="label">Course Number:</span>
                    <span>{course.course_number}</span>
                </div>
                <div className="label-container">
                    <span className="label">Course Description:</span>
                    <span>{course.description}</span>
                </div>
                <div className="label-container">
                    <span className="label">Prerequisites:</span>
                    <span>{prereqCourses}</span>
                </div>
                <p>Notice: {course.prerequisite_text}</p>
            </div>
        </div>
    );
}

function loadPrerequisites(prereqs) {
    return prereqs.map((prereq) => "\"" + prereq.id + "\" ");
}
export default CourseDetails
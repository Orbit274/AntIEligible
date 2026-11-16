import axios from "axios"
import { useEffect, useState } from "react";
import "../styles/CourseDetails.css"
import { parsePrereqTree, describeRequirements } from "../graph/prereqTree";

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

        if (error) return <div className="course-details-message">{error}</div>;
        if (!course) return <div className="course-details-message">Loading course details...</div>;
        const prereqCourses = loadPrerequisites(course.prerequisites)
        const parsed = parsePrereqTree(course.prerequisite_tree);
        const requirements = parsed ? describeRequirements(parsed) : null;
    return (
        <div id="course-details-container">
            <header id="course-detail-header">
                <img className="course-logo" src="/images/logo.png" alt="" />
                <div className="course-heading">
                    <span className="course-code">{course.department} {course.course_number}</span>
                    <h2>{course.title}</h2>
                    <span className="course-subtitle">
                        {course.department_name} · {formatUnits(course.min_units, course.max_units)}
                    </span>
                </div>
            </header>

            <div id="course-info">
                {course.description && <p className="course-description">{course.description}</p>}

                {/* Label on the left, value on the right, one row per fact */}
                <dl className="course-facts">
                    <div className="course-fact">
                        <dt>Prereqs</dt>
                        <dd>
                            {requirements === null && prereqCourses}
                            {requirements !== null && requirements.required.length === 0 && "None"}
                            {requirements !== null && requirements.required.length > 0 && (
                                <ul className="requirement-list">
                                    {requirements.required.map((line) => <li key={line}>{line}</li>)}
                                </ul>
                            )}
                        </dd>
                    </div>
                    {requirements !== null && requirements.excluded.length > 0 && (
                        <div className="course-fact">
                            <dt>Not open to</dt>
                            <dd>Students who completed {requirements.excluded.join(", ")}</dd>
                        </div>
                    )}
                    <div className="course-fact">
                        <dt>Units</dt>
                        <dd>{formatUnits(course.min_units, course.max_units)}</dd>
                    </div>
                    <div className="course-fact">
                        <dt>Department</dt>
                        <dd>{course.department_name} ({course.department})</dd>
                    </div>
                    {course.prerequisite_text && (
                        <div className="course-fact">
                            <dt>Catalog</dt>
                            <dd className="course-catalog">{course.prerequisite_text}</dd>
                        </div>
                    )}
                </dl>
            </div>
        </div>
    );
}

function loadPrerequisites(prereqs) {
    return prereqs.map((prereq) => "\"" + prereq.id + "\" ");
}

// 4 -> "4 units", 1 and 4 -> "1-4 units"
function formatUnits(min, max) {
    const units = min === max || max == null ? `${min}` : `${min}-${max}`;
    return `${units} ${units === "1" ? "unit" : "units"}`;
}
export default CourseDetails

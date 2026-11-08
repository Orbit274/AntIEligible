import "../styles/CoursePlanner.css"
import {useEffect, useState} from "react";
import SearchBar from "./SearchBar";
import PlannerYear from "./PlannerYear";
import {
    QUARTERS, MAX_YEARS, emptyPlan, addYear, removeYear, addCourse, removeCourse, 
    findCourse, countCourses, toPlannedCourse, courseLabel}
from "../planner/plan";

function Planner(){
    const [plan, setPlan] = useState(emptyPlan);
    const [target, setTarget] = useState("1:Fall");
    const [notice, setNotice] = useState("");
    const [targetYearText, targetQuarter] = target.split(":");
    const targetYear = plan.years.find((year) => year.id === Number(targetYearText)) ?? plan.years[0];

    function handleAdd(result) {
        const existing = findCourse(plan, result.id);
        if (existing) {
            setNotice(`${courseLabel(result)} is already planned for Year ${existing.yearNumber} ${existing.quarter}.`);
            return;
        }
        setNotice("");
        setPlan((current) => addCourse(current, targetYear.id, targetQuarter, toPlannedCourse(result)));
    }

    function handleRemoveCourse(courseId) {
        setNotice("");
        setPlan((current) => removeCourse(current, courseId));
    }

    function handleAddYear() {
        setNotice("");
        setPlan((current) => addYear(current));
    }

    function handleRemoveYear(yearId) {
        const year = plan.years.find((y) => y.id === yearId);
        const count = year ? countCourses(year) : 0;
        if (count > 0 && !window.confirm(`Remove this year and the ${count} class${count === 1 ? "" : "es"} in it?`)) {
            return;
        }
        setNotice("");
        setPlan((current) => removeYear(current, yearId));
    }

    return(
        <div id="planner-container">
            <div id="planner-header">
                <span id="planner-title">Planner</span>
                <div id="planner-toolbar">
                    <SearchBar onCourseChosen={handleAdd} />
                    <label id="add-to">
                        Add to
                        <select value={`${targetYear.id}:${targetQuarter}`} onChange={(e) => setTarget(e.target.value)}>
                            {plan.years.map((year, index) =>
                                QUARTERS.map((quarter) => (
                                    <option key={`${year.id}:${quarter}`} value={`${year.id}:${quarter}`}>
                                        Year {index + 1} · {quarter}
                                    </option>
                                ))
                            )}
                        </select>
                    </label>
                </div>
            </div>
            {notice && <p id="planner-notice">{notice}</p>}
            {plan.years.map((year, index) => (
                <PlannerYear
                    key={year.id}
                    year={year}
                    number={index + 1}
                    canRemove={plan.years.length > 1}
                    onRemoveYear={handleRemoveYear}
                    onRemoveCourse={handleRemoveCourse}
                />
            ))}
            <button
                id="add-year"
                onClick={handleAddYear}
                disabled={plan.years.length >= MAX_YEARS}
                title={plan.years.length >= MAX_YEARS ? `The planner holds up to ${MAX_YEARS} years` : ""}
            >
                + Add year
            </button>
        </div>
    );
}

export default Planner;
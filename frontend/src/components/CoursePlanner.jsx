import "../styles/CoursePlanner.css";
import { useState } from "react";
import SearchBar from "./SearchBar";
import PlannerYear from "./PlannerYear";
import ViewerPlanActions from "./ViewerPlanActions";
import CourseDetailsPanel from "./CourseDetailsPanel";
import {
    MAX_YEARS, 
    emptyPlan, 
    addYear, 
    removeYear, 
    addCourse, 
    removeCourse, 
    findCourse, 
    countCourses, 
    toPlannedCourse, 
    placeCourse
} from "../planner/plan";
import { readDraggedCourse, writeDraggedCourse } from "../planner/dragAndDrop";

function Planner() {
  const [plan, setPlan] = useState(emptyPlan);
  const [target, setTarget] = useState("1:Fall");
  const [viewed, setViewed] = useState(null);
  const [targetYearText, targetQuarter] = target.split(":");
  const targetYear =
    plan.years.find((year) => year.id === Number(targetYearText)) ??
    plan.years[0];
  const targetValue = `${targetYear.id}:${targetQuarter}`;
  const placement = viewed ? findCourse(plan, viewed.id) : null;

    function handleSearchPick(result) {
        setViewed(toPlannedCourse(result));
    }

    function handleCourseDragStart(event, result, effectAllowed = "copy") {
        writeDraggedCourse(event, result, effectAllowed);
    }

    function handleCourseDrop(event, yearId, quarter) {
        event.preventDefault();
        const result = readDraggedCourse(event);
        if (!result) {
            return;
        }

        const course = typeof result.label === "string" && "units" in result ? result : toPlannedCourse(result);
        setPlan((current) => {
            const currentPlacement = findCourse(current, course.id);
            if (currentPlacement?.yearId === yearId && currentPlacement?.quarter === quarter) {
                return current;
            }
            return placeCourse(current, yearId, quarter, course);
        });
    }

    function handleAddViewed() {
        if (placement) {
            return;
        }
        setPlan((current) => addCourse(current, targetYear.id, targetQuarter, viewed));
    }

    function handleRemoveViewed() {
        setPlan((current) => removeCourse(current, viewed.id));
    }

  function handleRemoveCourse(courseId) {
    setPlan((current) => removeCourse(current, courseId));
  }

  function handleAddYear() {
    setPlan((current) => addYear(current));
  }

  function handleRemoveYear(yearId) {
    const year = plan.years.find((y) => y.id === yearId);
    const count = year ? countCourses(year) : 0;
    if (
      count > 0 &&
      !window.confirm(
        `Remove this year and the ${count} class${count === 1 ? "" : "es"} in it?`,
      )
    ) {
      return;
    }
    setPlan((current) => removeYear(current, yearId));
  }

    return(
        <div id="planner-container">
            <div id="planner-header">
                <span id="planner-title">Planner</span>
                <div id="planner-toolbar">
                    <SearchBar onCourseChosen={handleSearchPick} onCourseDragStart={handleCourseDragStart}/>
                </div>
            </div>

            {plan.years.map((year, index) => (
                <PlannerYear
                    key={year.id}
                    year={year}
                    number={index + 1}
                    canRemove={plan.years.length > 1}
                    onRemoveYear={handleRemoveYear}
                    onRemoveCourse={handleRemoveCourse}
                    selectedId={viewed?.id}
                    onOpenCourse={setViewed}
                    onCourseDrop={handleCourseDrop}
                    onCourseDragStart={handleCourseDragStart}
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

      <CourseDetailsPanel
        courseId={viewed ? viewed.id : null}
        visible={viewed !== null}
        onClose={() => setViewed(null)}
      >
        {viewed && (
          <ViewerPlanActions
            plan={plan}
            placement={placement}
            targetValue={targetValue}
            onTargetChange={setTarget}
            onAdd={handleAddViewed}
            onRemove={handleRemoveViewed}
          />
        )}
      </CourseDetailsPanel>
    </div>
  );
}

export default Planner;

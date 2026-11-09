import PlannerQuarter from "./PlannerQuarter";
import {QUARTERS} from "../planner/plan";

// One year of the plan, a "Year N" heading and its four quarters side by side
function PlannerYear({year, number, canRemove, onRemoveYear, onRemoveCourse}) {
    return (
        <section className="planner-year">
            <div className="planner-year-header">
                <h2 className="planner-year-title">Year {number}</h2>
                {canRemove && (
                    <button className="remove-year" onClick={() => onRemoveYear(year.id)}>
                        Remove year
                    </button>
                )}
            </div>
            <div className="quarter-container">
                {QUARTERS.map((term) => (
                    <PlannerQuarter
                        key={term}
                        term={term}
                        courses={year.quarters[term]}
                        onRemoveCourse={onRemoveCourse}
                    />
                ))}
            </div>
        </section>
    );
}

export default PlannerYear;
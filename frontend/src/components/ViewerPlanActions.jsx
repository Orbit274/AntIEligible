import { placementLabel, targetOptions } from "../planner/plan";

// The planner's controls inside the class viewer
// If the class is not planned yet it says "Add to [Year X Quarter]" and theres an "add to plan" button
// If it is already planned it says "Planned for Year X Quarter" and there a "remove from plan" button
function ViewerPlanActions({ plan, placement, targetValue, onTargetChange, onAdd, onRemove }) {
    if (placement) {
        return (
            <>
                <span className="viewer-planned">Planned for {placementLabel(placement)}</span>
                <button className="viewer-button" onClick={onRemove}>Remove from plan</button>
            </>
        );
    }
    return (
        <>
            <label className="viewer-target">
                Add to
                <select value={targetValue} onChange={(e) => onTargetChange(e.target.value)}>
                    {targetOptions(plan).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </label>
            <button className="viewer-button" onClick={onAdd}>Add to plan</button>
        </>
    );
}

export default ViewerPlanActions;
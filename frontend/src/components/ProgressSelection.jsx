import { CourseStatus } from "../enums/courseStatus";
import "../styles/ProgressSelection.css";
function ProgressSelection({ handleSelectStatusOption }) {
  return (
    <div
      className="select-option-container"
      onClick={(event) => event.stopPropagation()}
    >
      <span>Mark course as...</span>
      <button
        className="select-button"
        onClick={() => handleSelectStatusOption(CourseStatus.COMPLETED)}
      >
        Completed
      </button>
      <button
        className="select-button"
        onClick={() => handleSelectStatusOption(CourseStatus.IN_PROGRESS)}
      >
        In-progress
      </button>
      <button
        className="select-button"
        onClick={() => handleSelectStatusOption(CourseStatus.NOT_STARTED)}
      >
        Not-started
      </button>
    </div>
  );
}

export default ProgressSelection;

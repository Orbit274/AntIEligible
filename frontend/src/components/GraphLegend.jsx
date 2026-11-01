import {
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  Clock4,
  MoveLeft,
} from "lucide-react";
import "../styles/GraphLegend.css";
function GraphLegend() {
  return (
    <>
      <div id="legend-container">
        <span className="legend-item">
          Target <MoveLeft /> Prerequisites
        </span>
        <span className="legend-item">
          <ChevronLeft />
          Collapse
        </span>
        <span className="legend-item">
          <ChevronRight />
          Expand
        </span>
        <span className="legend-item">
          <div id="straight-line-icon"></div> (AND)
        </span>
        <span className="legend-item">
          <div id="dashed-line-icon"></div>(OR)
        </span>
        <span className="legend-item">
          <CircleCheck fill="#58ff00" strokeWidth="1px" />
          Completed
        </span>
        <span className="legend-item">
          <Clock4 fill="yellow" strokeWidth="1px" /> In-progress
        </span>
        <span className="legend-item">
          <Circle fill="lightgrey" strokeWidth="1px" />
          Not-started
        </span>
      </div>
    </>
  );
}

export default GraphLegend;

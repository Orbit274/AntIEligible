import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleCheck,
  Clock4,
  MoveLeft,
  MoveUp,
} from "lucide-react";
import "../styles/GraphLegend.css";
import { Orientation } from "../graph/orientation";

function GraphLegend({ orientation = Orientation.LEFT_TO_RIGHT }) {
  // Icons follow the graph direction: prerequisites open to the right, or below
  const topDown = orientation === Orientation.TOP_DOWN;
  const TowardTarget = topDown ? MoveUp : MoveLeft;
  const CollapseIcon = topDown ? ChevronUp : ChevronLeft;
  const ExpandIcon = topDown ? ChevronDown : ChevronRight;
  return (
    <>
      <div id="legend-container" data-tour="graph-legend">
        <span className="legend-item">
          Target <TowardTarget /> Prerequisites
        </span>
        <span className="legend-item">
          <CollapseIcon />
          Collapse
        </span>
        <span className="legend-item">
          <ExpandIcon />
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

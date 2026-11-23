import { useReactFlow } from "@xyflow/react";
import { View, ZoomIn, ZoomOut } from "lucide-react";
import { useTutorialActions } from "./TutorialActionContext";
import "../styles/ZoomControls.css";
function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { reportTutorialAction } = useTutorialActions();
  return (
    <div id="zoom-btn-container" data-tour="graph-zoom-controls">
      <button className="zoom-btn" onClick={() => {
        zoomIn();
        reportTutorialAction("graph-zoom-in-used");
      }}>
        <ZoomIn />
      </button>
      <button className="zoom-btn" onClick={() => zoomOut()}>
        <ZoomOut />
      </button>
      <button className="zoom-btn" onClick={() => fitView()}>
        <View />
      </button>
    </div>
  );
}
export default ZoomControls;

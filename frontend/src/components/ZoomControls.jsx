import { useReactFlow } from "@xyflow/react";
import { View, ZoomIn, ZoomOut } from "lucide-react";
import "../styles/ZoomControls.css";
function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <div id="zoom-btn-container">
      <button className="zoom-btn" onClick={() => zoomIn()}>
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

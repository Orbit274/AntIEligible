import { useNodes, useReactFlow, useStore } from "@xyflow/react";
import "../styles/GraphScrollbars.css";

// Extra room around the courses so the scrollbars can go a little past the last node
const CONTENT_PADDING = 150;

// Scrollbars along the bottom and right of the graph
// The scrollable area is every node on the workspace plus whatever is currently on screen
// Dragging a thumb pans the view, scrolling the graph moves the thumbs
function GraphScrollbars() {
  const { getNodesBounds, getViewport, setViewport } = useReactFlow();
  const nodes = useNodes();
  const [x, y, zoom] = useStore((s) => s.transform);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);

  if (nodes.length === 0 || width === 0 || height === 0) {
    return null;
  }

  // Everything below is in flow coordinates, the view is the part of the graph on screen
  const view = { x: -x / zoom, y: -y / zoom, width: width / zoom, height: height / zoom };
  const bounds = getNodesBounds(nodes);
  const minX = Math.min(bounds.x - CONTENT_PADDING, view.x);
  const minY = Math.min(bounds.y - CONTENT_PADDING, view.y);
  const maxX = Math.max(bounds.x + bounds.width + CONTENT_PADDING, view.x + view.width);
  const maxY = Math.max(bounds.y + bounds.height + CONTENT_PADDING, view.y + view.height);

  // Thumb size is how much of the content is visible, its position is where the view starts
  const horizontal = {
    size: view.width / (maxX - minX),
    start: (view.x - minX) / (maxX - minX),
  };
  const vertical = {
    size: view.height / (maxY - minY),
    start: (view.y - minY) / (maxY - minY),
  };

  // Moving the thumb by some fraction of the track moves the view by the same fraction of the content
  function startDrag(event, axis) {
    event.preventDefault();
    event.stopPropagation();
    const track = event.currentTarget.parentElement.getBoundingClientRect();
    const trackLength = axis === "x" ? track.width : track.height;
    const contentLength = axis === "x" ? maxX - minX : maxY - minY;
    const startMouse = axis === "x" ? event.clientX : event.clientY;
    const startViewport = getViewport();

    function onMove(moveEvent) {
      const mouse = axis === "x" ? moveEvent.clientX : moveEvent.clientY;
      const flowDistance = ((mouse - startMouse) / trackLength) * contentLength;
      const screenDistance = flowDistance * startViewport.zoom;
      setViewport({
        ...startViewport,
        x: axis === "x" ? startViewport.x - screenDistance : startViewport.x,
        y: axis === "y" ? startViewport.y - screenDistance : startViewport.y,
      });
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <>
      {horizontal.size < 1 && (
        <div className="graph-scrollbar horizontal nodrag nopan">
          <div
            className="graph-scrollbar-thumb"
            style={{ left: `${horizontal.start * 100}%`, width: `${horizontal.size * 100}%` }}
            onPointerDown={(event) => startDrag(event, "x")}
          />
        </div>
      )}
      {vertical.size < 1 && (
        <div className="graph-scrollbar vertical nodrag nopan">
          <div
            className="graph-scrollbar-thumb"
            style={{ top: `${vertical.start * 100}%`, height: `${vertical.size * 100}%` }}
            onPointerDown={(event) => startDrag(event, "y")}
          />
        </div>
      )}
    </>
  );
}

export default GraphScrollbars;

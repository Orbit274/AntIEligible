import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";

// Pans and zooms the workspace to show the nodes in request.ids
function ViewFocus({ request }) {
  const { fitView } = useReactFlow();
  
  useEffect(() => {
    if (request.ids.length === 0) {
        return;
    }
    const timer = setTimeout(() => {
      fitView({ nodes: request.ids.map((id) => ({ id })), padding: 0.3, maxZoom: 1.2, duration: 400 });
    }, 100);
    return () => clearTimeout(timer);
  }, [request, fitView]);

  return null;
}

export default ViewFocus;
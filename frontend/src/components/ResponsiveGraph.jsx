import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";

function ResponsiveGraph() {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      fitView({ padding: 0.2, duration: 200 });
    });

    const container = document.querySelector(".react-flow");

    if (container) {
      observer.observe(container);
    }

    return () => observer.disconnect();
  }, [fitView]);

  return null;
}

export default ResponsiveGraph;
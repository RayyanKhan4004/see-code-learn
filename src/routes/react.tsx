import { createFileRoute } from "@tanstack/react-router";
import {
  ReactControls,
  ReactCodePanel,
  ComponentTreePanel,
  RenderLogPanel,
  NodeInspectorPanel,
  ReactLearningPanel,
  ReactLogsPanel,
} from "@/components/visualizers/react/Panels";

export const Route = createFileRoute("/react")({
  head: () => ({
    meta: [
      { title: "React Render Cycle · CodeVision" },
      { name: "description", content: "Visualize the React render cycle: component tree, re-renders, props/state, React.memo, useMemo, useCallback." },
    ],
  }),
  component: ReactPlayground,
});

function ReactPlayground() {
  return (
    <div className="flex h-[calc(100vh-2.75rem)] flex-col gap-3 p-3">
      <ReactControls />

      <div className="grid flex-1 gap-3 overflow-hidden lg:grid-cols-[1.1fr_1fr]">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex-1 min-h-0">
            <ReactCodePanel />
          </div>
          <ReactLearningPanel />
          <div className="h-44 min-h-0">
            <ReactLogsPanel />
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[1.1fr_1fr_1fr] gap-3">
          <ComponentTreePanel />
          <RenderLogPanel />
          <NodeInspectorPanel />
        </div>
      </div>
    </div>
  );
}

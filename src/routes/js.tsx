import { createFileRoute } from "@tanstack/react-router";
import { CodeEditor } from "@/components/visualizers/javascript/CodeEditor";
import { PlaybackControls } from "@/components/visualizers/javascript/PlaybackControls";
import { LearningPanel } from "@/components/visualizers/javascript/LearningPanel";
import {
  CallStackPanel,
  CallbackQueuePanel,
  ConsolePanel,
  HeapPanel,
  MicrotaskQueuePanel,
  WebApisPanel,
} from "@/components/visualizers/javascript/Panels";
import { LogsPanel } from "@/components/visualizers/javascript/LogsPanel";

export const Route = createFileRoute("/js")({
  head: () => ({
    meta: [
      { title: "JavaScript Visualizer · CodeVision" },
      { name: "description", content: "Live JavaScript playground that visualizes the call stack, heap, event loop, microtask and callback queues." },
    ],
  }),
  component: JsPlayground,
});

function JsPlayground() {
  return (
    <div className="flex h-[calc(100vh-2.75rem)] flex-col gap-3 p-3">
      <PlaybackControls />

      <div className="grid flex-1 gap-3 overflow-hidden lg:grid-cols-[1.1fr_1fr]">
        {/* Left column: editor + learning */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex-1 min-h-0">
            <CodeEditor />
          </div>
          <LearningPanel />
        </div>

        {/* Right column: runtime visualization */}
        <div className="grid min-h-0 grid-rows-[1fr_1fr_1fr] gap-3">
          <div className="grid grid-cols-2 gap-3 min-h-0">
            <CallStackPanel />
            <HeapPanel />
          </div>
          <div className="grid grid-cols-1 gap-3 min-h-0">
            <WebApisPanel />
          </div>
          <div className="grid grid-cols-2 gap-3 min-h-0">
            <div className="flex flex-col gap-3 min-h-0">
              <MicrotaskQueuePanel />
              <CallbackQueuePanel />
            </div>
            <ConsolePanel />
          </div>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { LiveReactPlayground } from "@/components/visualizers/react/LiveReactPlayground";

export const Route = createFileRoute("/react")({
  head: () => ({
    meta: [
      { title: "React Live Playground · CodeVision" },
      {
        name: "description",
        content:
          "Write React components and watch real render commits, state changes, and console output in real time.",
      },
    ],
  }),
  component: ReactPlayground,
});

function ReactPlayground() {
  return (
    <div className="h-[calc(100vh-2.75rem)] p-3">
      <LiveReactPlayground />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Cpu, Layers, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeVision — See how your code actually runs" },
      { name: "description", content: "Interactive visualizer for the JavaScript call stack, heap, event loop, and queues. Built for developers who want to understand, not just memorize." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="h-full overflow-auto">
      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--primary)] animate-pulse" />
          Phase 1 · JavaScript Visualizer
        </div>
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
          See how your code{" "}
          <span className="bg-gradient-to-r from-[color:var(--primary)] via-[color:var(--heap)] to-[color:var(--microtask)] bg-clip-text text-transparent">
            actually runs
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          CodeVision animates the call stack, memory heap, event loop, and queues
          step-by-step — so you can finally see <em>why</em> async code behaves the way it does.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to="/js">Open Playground <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="mt-20 grid w-full gap-4 md:grid-cols-3">
          {[
            { icon: Layers, color: "stack", title: "Call Stack", body: "Watch frames push and pop in real time as functions execute." },
            { icon: Cpu, color: "heap", title: "Heap & GC", body: "See objects allocated, referenced, and garbage-collected." },
            { icon: Zap, color: "microtask", title: "Event Loop", body: "Microtasks, macrotasks, Web APIs — finally make sense." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5 text-left">
              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md"
                style={{ background: `color-mix(in oklab, var(--${f.color}) 18%, transparent)`, color: `var(--${f.color})` }}
              >
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-xs text-muted-foreground">
          <Code2 className="mr-1 inline h-3 w-3" />
          More modules coming: React render cycle · Next.js SSR/CSR · DBMS · Network
        </div>
      </section>
    </div>
  );
}

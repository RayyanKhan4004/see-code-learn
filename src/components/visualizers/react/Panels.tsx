import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Layers,
  Trash2,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { useReactPlayground } from "@/store/react-playground";
import { reactExamples } from "@/lib/visualizer/react/examples";
import type { ComponentNode } from "@/lib/visualizer/react/types";

/* ---------------- Controls ---------------- */

export function ReactControls() {
  const {
    isPlaying,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
    speedMs,
    setSpeed,
    stepIndex,
    trace,
    exampleId,
    loadExample,
  } = useReactPlayground();

  useEffect(() => {
    if (!isPlaying) return;
    const t = setTimeout(stepForward, speedMs);
    return () => clearTimeout(t);
  }, [isPlaying, stepIndex, speedMs, stepForward]);

  useEffect(() => {
    if (stepIndex >= trace.length - 1 && isPlaying) pause();
  }, [stepIndex, trace.length, isPlaying, pause]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <Select value={exampleId} onValueChange={loadExample}>
        <SelectTrigger className="h-9 w-[220px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {reactExamples.map((ex) => (
            <SelectItem key={ex.id} value={ex.id}>
              {ex.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={reset} title="Reset">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={stepBackward} disabled={stepIndex < 0}>
          <SkipBack className="h-4 w-4" />
        </Button>
        {isPlaying ? (
          <Button size="sm" variant="secondary" onClick={pause} className="gap-1.5">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (stepIndex >= trace.length - 1) reset();
              play();
            }}
            className="gap-1.5"
          >
            <Play className="h-4 w-4" />
            Play
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={stepForward}
          disabled={stepIndex >= trace.length - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 items-center gap-2 min-w-[160px]">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Speed</span>
        <Slider
          value={[1400 - speedMs]}
          min={100}
          max={1300}
          step={100}
          onValueChange={(v) => setSpeed(1400 - v[0])}
          className="flex-1"
        />
      </div>

      <div className="font-mono text-xs text-muted-foreground tabular-nums">
        Step {Math.max(0, stepIndex + 1)} / {trace.length}
      </div>
    </div>
  );
}

/* ---------------- Code preview ---------------- */

export function ReactCodePanel() {
  const code = useReactPlayground((s) => s.code);
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <Header title="Code" hint="example" />
      <ScrollArea className="flex-1">
        <pre className="whitespace-pre p-3 font-mono text-xs leading-5 text-foreground">{code}</pre>
      </ScrollArea>
    </Card>
  );
}

/* ---------------- Component tree ---------------- */

interface TreeNode extends ComponentNode {
  children: TreeNode[];
}
function buildTree(nodes: ComponentNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  nodes.forEach((n) => map.set(n.id, { ...n, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach((n) => {
    if (n.parentId && map.has(n.parentId)) map.get(n.parentId)!.children.push(n);
    else roots.push(n);
  });
  return roots;
}

export function ComponentTreePanel() {
  const nodes = useReactPlayground((s) => s.vm.nodes);
  const highlight = useReactPlayground((s) => s.vm.highlightId);
  const tree = buildTree(nodes);
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <Header title="Component Tree" hint="fiber" icon={<Layers className="h-3.5 w-3.5" />} />
      <ScrollArea className="flex-1 p-3">
        {tree.length === 0 ? (
          <div className="text-xs italic text-muted-foreground">Nothing mounted yet.</div>
        ) : (
          tree.map((n) => <TreeRow key={n.id} node={n} depth={0} highlight={highlight} />)
        )}
      </ScrollArea>
    </Card>
  );
}

function TreeRow({
  node,
  depth,
  highlight,
}: {
  node: TreeNode;
  depth: number;
  highlight: string | null;
}) {
  const isHot = highlight === node.id;
  return (
    <div className="font-mono text-xs">
      <motion.div
        layout
        animate={{
          backgroundColor: isHot
            ? "color-mix(in srgb, var(--primary) 22%, transparent)"
            : "transparent",
          scale: isHot ? 1.01 : 1,
        }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
        className="my-0.5 flex items-center gap-2 rounded px-2 py-1"
        style={{ marginLeft: depth * 14 }}
      >
        <span className="text-muted-foreground">{node.children.length ? "▾" : "•"}</span>
        <span className="text-foreground">&lt;{node.name}/&gt;</span>
        {node.memo && (
          <span className="rounded bg-[color:var(--microtask)]/15 px-1 text-[9px] uppercase text-[color:var(--microtask)]">
            memo
          </span>
        )}
        <span className="ml-auto flex gap-2 text-[10px] text-muted-foreground tabular-nums">
          <span title="Renders">↻ {node.renderCount}</span>
          {node.skippedCount > 0 && (
            <span className="text-[color:var(--callback)]" title="Skipped">
              ⤾ {node.skippedCount}
            </span>
          )}
        </span>
      </motion.div>
      {node.children.map((c) => (
        <TreeRow key={c.id} node={c} depth={depth + 1} highlight={highlight} />
      ))}
    </div>
  );
}

/* ---------------- Render log ---------------- */

export function RenderLogPanel() {
  const log = useReactPlayground((s) => s.vm.renderLog);
  const totalRenders = useReactPlayground((s) => s.vm.totalRenders);
  const totalSkipped = useReactPlayground((s) => s.vm.totalSkipped);
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <Header
        title="Render Log"
        hint={`${totalRenders} renders · ${totalSkipped} skipped`}
        icon={<Sparkles className="h-3.5 w-3.5" />}
      />
      <ScrollArea className="flex-1 p-2">
        <AnimatePresence initial={false}>
          {log.map((e) => (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-[auto_1fr_auto] items-baseline gap-2 border-b border-border/30 px-1 py-1 font-mono text-[11px]"
            >
              <span
                className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                style={{
                  backgroundColor: e.skipped
                    ? "color-mix(in srgb, var(--callback) 18%, transparent)"
                    : "color-mix(in srgb, var(--primary) 18%, transparent)",
                  color: e.skipped ? "var(--callback)" : "var(--primary)",
                }}
              >
                {e.skipped ? "skip" : "render"}
              </span>
              <span className="truncate text-foreground">
                &lt;{e.name}/&gt; <span className="text-muted-foreground">· {e.reason}</span>
              </span>
              <span className="tabular-nums text-muted-foreground">{e.durationMs}ms</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {log.length === 0 && (
          <div className="px-2 py-3 text-xs italic text-muted-foreground">No renders yet.</div>
        )}
      </ScrollArea>
    </Card>
  );
}

/* ---------------- Props / State inspector ---------------- */

export function NodeInspectorPanel() {
  const nodes = useReactPlayground((s) => s.vm.nodes);
  const highlight = useReactPlayground((s) => s.vm.highlightId);
  const node = nodes.find((n) => n.id === highlight) ?? nodes[nodes.length - 1];
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <Header title="Props & State" hint={node ? `<${node.name}/>` : "—"} />
      <ScrollArea className="flex-1 p-3">
        {!node ? (
          <div className="text-xs italic text-muted-foreground">No component selected.</div>
        ) : (
          <div className="flex flex-col gap-3 font-mono text-xs">
            <KV title="props" data={node.props} tone="heap" />
            <KV title="state" data={node.state} tone="microtask" />
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              renders: {node.renderCount} · skipped: {node.skippedCount}
              {node.lastReason && <> · last: {node.lastReason}</>}
            </div>
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}

function KV({ title, data, tone }: { title: string; data: Record<string, unknown>; tone: string }) {
  const entries = Object.entries(data);
  return (
    <div>
      <div
        className="mb-1 text-[10px] uppercase tracking-wider"
        style={{ color: `var(--${tone})` }}
      >
        {title}
      </div>
      {entries.length === 0 ? (
        <div className="italic text-muted-foreground">∅</div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {entries.map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-muted-foreground">{k}:</span>
              <span className="text-foreground">{formatValue(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return `"${v}"`;
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

/* ---------------- Learning panel ---------------- */

export function ReactLearningPanel() {
  const step = useReactPlayground((s) => s.vm.currentStep);
  return (
    <Card className="flex flex-col overflow-hidden border-border bg-card">
      <Header title="What's happening" hint={step?.concept ?? "—"} />
      <div className="flex flex-col gap-2 p-3 text-xs">
        {step ? (
          <>
            <div className="text-foreground">{step.explanation}</div>
            <div className="text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-[10px]">why · </span>
              {step.why}
            </div>
          </>
        ) : (
          <div className="italic text-muted-foreground">
            Press play to walk through the render cycle.
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Logs panel (session only) ---------------- */

export function ReactLogsPanel() {
  const logs = useReactPlayground((s) => s.logs);
  const clearLogs = useReactPlayground((s) => s.clearLogs);
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Event Logs</h3>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {logs.length}
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={clearLogs}
          disabled={!logs.length}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 font-mono text-[11px]">
          {logs.map((l) => (
            <div
              key={l.id}
              className="flex items-baseline gap-2 border-b border-border/30 px-1 py-1"
            >
              <span className="tabular-nums text-muted-foreground">#{l.stepIndex + 1}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase">{l.kind}</span>
              <span className="truncate text-foreground">{l.label}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="px-2 py-3 italic text-muted-foreground">No events yet.</div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

/* ---------------- Header ---------------- */

function Header({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
        {icon}
      </div>
      {hint && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}

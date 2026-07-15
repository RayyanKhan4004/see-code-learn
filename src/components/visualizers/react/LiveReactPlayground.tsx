import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Trash2, Sparkles, AlertCircle } from "lucide-react";
import {
  Component,
  Profiler,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ProfilerOnRenderCallback,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { compileUserCode } from "@/lib/visualizer/react/live-runtime";

const DEFAULT_CODE = `// Live React sandbox — write components, watch them render.
// Every state change and commit is captured below in real time.

function Counter({ label }) {
  const [count, setCount] = useState(0);
  return (
    <div style={{ padding: 8, border: '1px solid #444', borderRadius: 6, marginBottom: 8 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{count}</div>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}

function App() {
  const [name, setName] = useState('world');
  return (
    <div style={{ fontFamily: 'system-ui', color: '#e5e7eb' }}>
      <h2>Hello, {name}!</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <Counter label="Counter A" />
      <Counter label="Counter B" />
    </div>
  );
}
`;

interface CommitEntry {
  id: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  time: number;
}

interface StateEntry {
  id: string;
  component: string;
  hookIndex: number;
  prev: unknown;
  next: unknown;
  time: number;
}

interface LogEntry {
  id: string;
  level: "log" | "warn" | "error";
  message: string;
  time: number;
}

let uid = 0;
const nextId = () => `${Date.now()}-${uid++}`;

export function LiveReactPlayground() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [Root, setRoot] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [commits, setCommits] = useState<CommitEntry[]>([]);
  const [states, setStates] = useState<StateEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const mountTimeRef = useRef<number>(0);

  const onStateChange = useCallback(
    (component: string, hookIndex: number, prev: unknown, next: unknown) => {
      setStates((s) => [
        ...s,
        { id: nextId(), component, hookIndex, prev, next, time: performance.now() },
      ]);
    },
    [],
  );

  const onLog = useCallback((level: "log" | "warn" | "error", args: unknown[]) => {
    setLogs((l) => [
      ...l,
      {
        id: nextId(),
        level,
        message: args.map(fmt).join(" "),
        time: performance.now(),
      },
    ]);
  }, []);

  const run = useCallback(() => {
    try {
      const { Root: R } = compileUserCode(code, { onStateChange, onLog });
      setError(null);
      setCommits([]);
      setStates([]);
      setLogs([]);
      mountTimeRef.current = performance.now();
      setRoot(() => R);
      setRunKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRoot(null);
    }
  }, [code, onStateChange, onLog]);

  // Auto-run on first mount.
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCommit: ProfilerOnRenderCallback = useCallback(
    (id, phase, actualDuration, baseDuration) => {
      setCommits((c) => [
        ...c,
        {
          id: nextId(),
          phase: phase as CommitEntry["phase"],
          actualDuration,
          baseDuration,
          time: performance.now() - mountTimeRef.current,
        },
      ]);
    },
    [],
  );

  const totalRenders = commits.length;

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[1fr_1fr]">
      {/* LEFT: editor + preview */}
      <div className="flex min-h-0 flex-col gap-3">
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider">Your Code</h3>
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" onClick={run} className="h-7 gap-1.5">
                <Play className="h-3.5 w-3.5" /> Run
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  setCode(DEFAULT_CODE);
                  setTimeout(run, 0);
                }}
                title="Reset code"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <textarea
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-5 text-foreground outline-none"
          />
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden border-border bg-card lg:h-56">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider">Live Preview</h3>
            {error && (
              <span className="flex items-center gap-1 text-[10px] text-destructive">
                <AlertCircle className="h-3 w-3" /> error
              </span>
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3">
              {error ? (
                <pre className="whitespace-pre-wrap font-mono text-xs text-destructive">{error}</pre>
              ) : Root ? (
                <ErrorBoundary key={runKey} onError={setError}>
                  <Profiler id="user-root" onRender={onCommit}>
                    <Root />
                  </Profiler>
                </ErrorBoundary>
              ) : (
                <div className="text-xs italic text-muted-foreground">Press Run.</div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* RIGHT: commits, state changes, console */}
      <div className="grid min-h-0 grid-rows-3 gap-3">
        <Card className="flex min-h-0 flex-col overflow-hidden border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--primary)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Render Commits</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{totalRenders}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCommits([])}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 font-mono text-[11px]">
              <AnimatePresence initial={false}>
                {commits.map((c, i) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-[auto_auto_1fr_auto] items-baseline gap-2 border-b border-border/30 px-1 py-1"
                  >
                    <span className="tabular-nums text-muted-foreground">#{i + 1}</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] uppercase"
                      style={{
                        backgroundColor:
                          c.phase === "mount"
                            ? "color-mix(in srgb, var(--heap) 22%, transparent)"
                            : "color-mix(in srgb, var(--primary) 22%, transparent)",
                        color: c.phase === "mount" ? "var(--heap)" : "var(--primary)",
                      }}
                    >
                      {c.phase}
                    </span>
                    <span className="text-muted-foreground">
                      actual {c.actualDuration.toFixed(2)}ms · base {c.baseDuration.toFixed(2)}ms
                    </span>
                    <span className="tabular-nums text-muted-foreground">+{c.time.toFixed(0)}ms</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {commits.length === 0 && (
                <div className="px-2 py-3 italic text-muted-foreground">No commits yet.</div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider">State Changes</h3>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setStates([])}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 font-mono text-[11px]">
              <AnimatePresence initial={false}>
                {states.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-[auto_1fr] items-baseline gap-2 border-b border-border/30 px-1 py-1"
                  >
                    <span className="rounded bg-[color:var(--microtask)]/20 px-1.5 py-0.5 text-[9px] uppercase text-[color:var(--microtask)]">
                      {s.component}[{s.hookIndex}]
                    </span>
                    <span className="truncate text-foreground">
                      <span className="text-muted-foreground">{fmt(s.prev)}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      {fmt(s.next)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {states.length === 0 && (
                <div className="px-2 py-3 italic text-muted-foreground">No state updates yet.</div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider">Console</h3>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setLogs([])}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 font-mono text-[11px]">
              {logs.map((l) => (
                <div key={l.id} className="border-b border-border/30 px-1 py-1 text-foreground">
                  <span className="mr-2 text-muted-foreground">›</span>
                  {l.message}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="px-2 py-3 italic text-muted-foreground">No output yet.</div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}

function fmt(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return `"${v}"`;
  if (typeof v === "function") return "ƒ";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

/* ---- tiny error boundary so user code doesn't nuke the panel ---- */

import { Component, type ReactNode } from "react";

class ErrorBoundary extends Component<
  { children: ReactNode; onError: (msg: string) => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    this.props.onError(err.message);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

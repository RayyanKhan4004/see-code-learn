import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { usePlayground } from "@/store/playground";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, ScrollText, Download } from "lucide-react";
import { useEffect, useRef } from "react";

const KIND_TONE: Record<string, string> = {
  "push-stack": "stack",
  "pop-stack": "stack",
  "alloc-heap": "heap",
  "free-heap": "heap",
  "register-webapi": "webapi",
  "complete-webapi": "webapi",
  "enqueue-callback": "callback",
  "dequeue-callback": "callback",
  "enqueue-microtask": "microtask",
  "dequeue-microtask": "microtask",
  console: "console",
  note: "muted",
};

export function LogsPanel() {
  const logs = usePlayground((s) => s.logs);
  const clearLogs = usePlayground((s) => s.clearLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  const download = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codevision-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Event Logs
          </h3>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {logs.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            session only
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={download}
            disabled={!logs.length}
            title="Download JSON"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={clearLogs}
            disabled={!logs.length}
            title="Clear logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="flex flex-col p-2 font-mono text-[11px]">
          <AnimatePresence initial={false}>
            {logs.map((l) => {
              const tone = KIND_TONE[l.kind] ?? "muted";
              return (
                <motion.div
                  key={l.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-[auto_auto_1fr] items-baseline gap-2 border-b border-border/30 px-1 py-1"
                >
                  <span className="tabular-nums text-muted-foreground">#{l.stepIndex + 1}</span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--${tone}) 18%, transparent)`,
                      color: `var(--${tone})`,
                    }}
                  >
                    {l.kind}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-foreground">
                      <span className="text-muted-foreground">L{l.line}</span>{" "}
                      <span>{l.label}</span>
                    </div>
                    {l.explanation && (
                      <div className="truncate text-[10px] text-muted-foreground">
                        {l.explanation}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {logs.length === 0 && (
            <div className="px-2 py-3 italic text-muted-foreground">
              No events yet — run your code to start logging.
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

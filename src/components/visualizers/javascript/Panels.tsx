import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import { usePlayground } from "@/store/playground";
import { Layers } from "lucide-react";

export function CallStackPanel() {
  const stack = usePlayground((s) => s.vm.callStack);
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <PanelHeader title="Call Stack" hint="LIFO" tone="stack" icon={<Layers className="h-3.5 w-3.5" />} />
      <ScrollArea className="flex-1 p-3">
        <div className="flex flex-col-reverse gap-1.5">
          <AnimatePresence initial={false}>
            {stack.map((frame, idx) => (
              <motion.div
                key={frame.id}
                layout
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="rounded-md border border-[color:var(--stack)]/40 bg-[color:var(--stack)]/10 px-3 py-2 font-mono text-sm text-foreground"
              >
                <span className="text-[color:var(--stack)]">▸</span> {frame.name}
                {idx === stack.length - 1 && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">top</span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {stack.length === 0 && <EmptyHint label="Stack is empty" />}
        </div>
      </ScrollArea>
    </Card>
  );
}

export function HeapPanel() {
  const heap = usePlayground((s) => s.vm.heap);
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <PanelHeader title="Memory Heap" hint="references" tone="heap" />
      <ScrollArea className="flex-1 p-3">
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence initial={false}>
            {heap.map((obj) => (
              <motion.div
                key={obj.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 360, damping: 24 }}
                className="rounded-md border border-[color:var(--heap)]/40 bg-[color:var(--heap)]/10 p-2 font-mono text-xs"
              >
                <div className="text-[10px] uppercase tracking-wider text-[color:var(--heap)]">{obj.kind}</div>
                <div className="text-foreground">{obj.label}</div>
                {obj.preview && (
                  <div className="mt-1 truncate text-[10px] text-muted-foreground">{obj.preview}</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {heap.length === 0 && <EmptyHint label="No allocations" />}
        </div>
      </ScrollArea>
    </Card>
  );
}

export function WebApisPanel() {
  const apis = usePlayground((s) => s.vm.webApis);
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <PanelHeader title="Web APIs" hint="browser" tone="webapi" />
      <ScrollArea className="flex-1 p-3">
        <div className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {apis.map((api) => (
              <motion.div
                key={api.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-md border border-[color:var(--webapi)]/40 bg-[color:var(--webapi)]/10 px-3 py-2 font-mono text-xs"
              >
                {api.label}
              </motion.div>
            ))}
          </AnimatePresence>
          {apis.length === 0 && <EmptyHint label="Idle" />}
        </div>
      </ScrollArea>
    </Card>
  );
}

export function CallbackQueuePanel() {
  const queue = usePlayground((s) => s.vm.callbackQueue);
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <PanelHeader title="Callback Queue" hint="macrotasks · FIFO" tone="callback" />
      <ScrollArea className="flex-1 p-3">
        <div className="flex gap-1.5 overflow-x-auto">
          <AnimatePresence initial={false}>
            {queue.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="shrink-0 rounded-md border border-[color:var(--callback)]/40 bg-[color:var(--callback)]/10 px-3 py-2 font-mono text-xs"
              >
                {item.label}
              </motion.div>
            ))}
          </AnimatePresence>
          {queue.length === 0 && <EmptyHint label="Empty" />}
        </div>
      </ScrollArea>
    </Card>
  );
}

export function MicrotaskQueuePanel() {
  const queue = usePlayground((s) => s.vm.microtaskQueue);
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <PanelHeader title="Microtask Queue" hint="promises · drained first" tone="microtask" />
      <ScrollArea className="flex-1 p-3">
        <div className="flex gap-1.5 overflow-x-auto">
          <AnimatePresence initial={false}>
            {queue.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="shrink-0 rounded-md border border-[color:var(--microtask)]/40 bg-[color:var(--microtask)]/10 px-3 py-2 font-mono text-xs"
              >
                {item.label}
              </motion.div>
            ))}
          </AnimatePresence>
          {queue.length === 0 && <EmptyHint label="Empty" />}
        </div>
      </ScrollArea>
    </Card>
  );
}

export function ConsolePanel() {
  const entries = usePlayground((s) => s.vm.console);
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border bg-card">
      <PanelHeader title="Console" hint="output" tone="console" />
      <ScrollArea className="flex-1">
        <div className="p-3 font-mono text-xs">
          <AnimatePresence initial={false}>
            {entries.map((e) => (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-border/40 py-1 text-foreground"
              >
                <span className="mr-2 text-muted-foreground">›</span>
                {e.message}
              </motion.div>
            ))}
          </AnimatePresence>
          {entries.length === 0 && <EmptyHint label="No output yet" />}
        </div>
      </ScrollArea>
    </Card>
  );
}

function PanelHeader({
  title,
  hint,
  tone,
  icon,
}: {
  title: string;
  hint?: string;
  tone: "stack" | "heap" | "webapi" | "callback" | "microtask" | "console";
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: `var(--${tone})` }}
        />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
        {icon}
      </div>
      {hint && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{hint}</span>}
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return <div className="px-1 py-2 text-xs italic text-muted-foreground">{label}</div>;
}

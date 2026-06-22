import { create } from "zustand";
import { applyReactStep, initialReactState, type ReactStep, type ReactVmState } from "@/lib/visualizer/react/types";
import { reactExamples } from "@/lib/visualizer/react/examples";

export interface ReactLogEntry {
  id: string;
  stepIndex: number;
  kind: ReactStep["kind"];
  label: string;
  explanation: string;
  concept: string;
}

interface ReactPlaygroundState {
  trace: ReactStep[];
  stepIndex: number;
  vm: ReactVmState;
  isPlaying: boolean;
  speedMs: number;
  exampleId: string;
  code: string;
  logs: ReactLogEntry[];

  loadExample: (id: string) => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (ms: number) => void;
  clearLogs: () => void;
}

function computeAt(trace: ReactStep[], index: number): ReactVmState {
  let s = initialReactState;
  for (let i = 0; i <= index && i < trace.length; i++) s = applyReactStep(s, trace[i]);
  return s;
}

let lid = 0;
function makeLog(step: ReactStep, idx: number): ReactLogEntry {
  const p: any = step.payload ?? {};
  const label = p.name ?? p.id ?? step.kind;
  return {
    id: `rlog-${++lid}`,
    stepIndex: idx,
    kind: step.kind,
    label: String(label),
    explanation: step.explanation,
    concept: step.concept,
  };
}

const first = reactExamples[0];

export const useReactPlayground = create<ReactPlaygroundState>((set, get) => ({
  trace: first.trace,
  stepIndex: -1,
  vm: initialReactState,
  isPlaying: false,
  speedMs: 800,
  exampleId: first.id,
  code: first.code,
  logs: [],

  loadExample: (id) => {
    const ex = reactExamples.find((e) => e.id === id);
    if (!ex) return;
    set({
      trace: ex.trace,
      code: ex.code,
      exampleId: id,
      stepIndex: -1,
      vm: initialReactState,
      isPlaying: false,
      logs: [],
    });
  },
  reset: () => set({ stepIndex: -1, vm: initialReactState, isPlaying: false, logs: [] }),
  stepForward: () => {
    const { trace, stepIndex, vm, logs } = get();
    if (stepIndex >= trace.length - 1) { set({ isPlaying: false }); return; }
    const next = stepIndex + 1;
    const step = trace[next];
    set({ stepIndex: next, vm: applyReactStep(vm, step), logs: [...logs, makeLog(step, next)] });
  },
  stepBackward: () => {
    const { trace, stepIndex, logs } = get();
    if (stepIndex < 0) return;
    const prev = stepIndex - 1;
    set({ stepIndex: prev, vm: computeAt(trace, prev), logs: logs.slice(0, -1) });
  },
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (ms) => set({ speedMs: ms }),
  clearLogs: () => set({ logs: [] }),
}));

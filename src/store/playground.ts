import { create } from "zustand";
import {
  applyJsStep,
  initialJsState,
  type JsStep,
  type JsVmState,
} from "@/lib/visualizer/types";
import { javascriptModule } from "@/lib/visualizer/javascript/examples";
import { traceCode } from "@/lib/visualizer/javascript/tracer";

export interface LogEntry {
  id: string;
  ts: number;
  stepIndex: number;
  kind: JsStep["kind"];
  line: number;
  label: string;
  explanation: string;
  concept: string;
}

interface PlaygroundState {
  code: string;
  trace: JsStep[];
  stepIndex: number;
  vm: JsVmState;
  isPlaying: boolean;
  speedMs: number;
  exampleId: string;
  isTracing: boolean;
  traceError: string | null;
  isLiveTrace: boolean;
  logs: LogEntry[];

  setCode: (code: string) => void;
  loadExample: (id: string) => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (ms: number) => void;
  runCode: () => Promise<void>;
  clearLogs: () => void;
}

function computeStateAt(trace: JsStep[], index: number): JsVmState {
  let state = initialJsState;
  for (let i = 0; i <= index && i < trace.length; i++) {
    state = applyJsStep(state, trace[i]);
  }
  return state;
}

let logUid = 0;
function makeLog(step: JsStep, stepIndex: number): LogEntry {
  const payload: any = step.payload ?? {};
  const label =
    payload.label ??
    payload.name ??
    payload.message ??
    (payload.id ? String(payload.id) : step.kind);
  return {
    id: `log-${++logUid}`,
    ts: Date.now(),
    stepIndex,
    kind: step.kind,
    line: step.line,
    label: String(label),
    explanation: step.explanation,
    concept: step.concept,
  };
}

const firstExample = javascriptModule.examples[0];

export const usePlayground = create<PlaygroundState>((set, get) => ({
  code: firstExample.code,
  trace: firstExample.trace,
  stepIndex: -1,
  vm: initialJsState,
  isPlaying: false,
  speedMs: 700,
  exampleId: firstExample.id,
  isTracing: false,
  traceError: null,
  isLiveTrace: false,
  logs: [],

  setCode: (code) => set({ code }),

  loadExample: (id) => {
    const ex = javascriptModule.examples.find((e) => e.id === id);
    if (!ex) return;
    set({
      code: ex.code,
      trace: ex.trace,
      stepIndex: -1,
      vm: initialJsState,
      isPlaying: false,
      exampleId: id,
      isLiveTrace: false,
      traceError: null,
      logs: [],
    });
  },

  reset: () => set({ stepIndex: -1, vm: initialJsState, isPlaying: false, logs: [] }),

  stepForward: () => {
    const { trace, stepIndex, vm, logs } = get();
    if (stepIndex >= trace.length - 1) {
      set({ isPlaying: false });
      return;
    }
    const next = stepIndex + 1;
    const step = trace[next];
    const newVm = applyJsStep(vm, step);
    set({
      stepIndex: next,
      vm: newVm,
      logs: [...logs, makeLog(step, next)],
    });
  },

  stepBackward: () => {
    const { trace, stepIndex, logs } = get();
    if (stepIndex < 0) return;
    const prev = stepIndex - 1;
    // Drop the last log entry that corresponds to the step we're undoing.
    const trimmed = logs.length > 0 ? logs.slice(0, -1) : logs;
    set({ stepIndex: prev, vm: computeStateAt(trace, prev), logs: trimmed });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (ms) => set({ speedMs: ms }),

  runCode: async () => {
    const { code } = get();
    set({ isTracing: true, traceError: null, isPlaying: false });
    try {
      const trace = await traceCode(code);
      set({
        trace,
        stepIndex: -1,
        vm: initialJsState,
        isTracing: false,
        isLiveTrace: true,
        isPlaying: true,
        logs: [],
      });
    } catch (e) {
      set({ isTracing: false, traceError: (e as Error).message });
    }
  },

  clearLogs: () => set({ logs: [] }),
}));

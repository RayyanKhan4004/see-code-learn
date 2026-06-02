import { create } from "zustand";
import {
  applyJsStep,
  initialJsState,
  type JsStep,
  type JsVmState,
} from "@/lib/visualizer/types";
import { javascriptModule } from "@/lib/visualizer/javascript/examples";
import { traceCode } from "@/lib/visualizer/javascript/tracer";

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

  setCode: (code: string) => void;
  loadExample: (id: string) => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (ms: number) => void;
  runCode: () => Promise<void>;
}

function computeStateAt(trace: JsStep[], index: number): JsVmState {
  let state = initialJsState;
  for (let i = 0; i <= index && i < trace.length; i++) {
    state = applyJsStep(state, trace[i]);
  }
  return state;
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
    });
  },

  reset: () => set({ stepIndex: -1, vm: initialJsState, isPlaying: false }),

  stepForward: () => {
    const { trace, stepIndex, vm } = get();
    if (stepIndex >= trace.length - 1) {
      set({ isPlaying: false });
      return;
    }
    const next = stepIndex + 1;
    const newVm = applyJsStep(vm, trace[next]);
    set({ stepIndex: next, vm: newVm });
  },

  stepBackward: () => {
    const { trace, stepIndex } = get();
    if (stepIndex < 0) return;
    const prev = stepIndex - 1;
    set({ stepIndex: prev, vm: computeStateAt(trace, prev) });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (ms) => set({ speedMs: ms }),
}));

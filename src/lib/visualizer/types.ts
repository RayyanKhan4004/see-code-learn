// Core types for the visualization engine.
// Designed to be reusable across future modules (React, Next.js, DBMS).

export type ModuleId = "javascript" | "react" | "nextjs" | "dbms" | "network";

export interface VisualizerModule<TStep = unknown> {
  id: ModuleId;
  name: string;
  description: string;
  examples: ExampleProgram<TStep>[];
}

export interface ExampleProgram<TStep = unknown> {
  id: string;
  title: string;
  concept: string;
  description: string;
  code: string;
  /** Pre-computed trace of execution steps. */
  trace: TStep[];
}

/* ---------- JavaScript module step model ---------- */

export type JsStepKind =
  | "push-stack"
  | "pop-stack"
  | "alloc-heap"
  | "free-heap"
  | "register-webapi"
  | "complete-webapi"
  | "enqueue-callback"
  | "enqueue-microtask"
  | "dequeue-callback"
  | "dequeue-microtask"
  | "console"
  | "note";

export interface StackFrame {
  id: string;
  name: string;
}

export interface HeapObject {
  id: string;
  label: string;
  kind: "object" | "function" | "array" | "closure";
  preview?: string;
}

export interface WebApiTask {
  id: string;
  label: string;
}

export interface QueueItem {
  id: string;
  label: string;
}

export interface ConsoleEntry {
  id: string;
  level: "log" | "warn" | "error" | "info";
  message: string;
}

export interface JsStep {
  kind: JsStepKind;
  line: number;
  explanation: string;
  why: string;
  concept: string;
  payload?:
    | StackFrame
    | HeapObject
    | WebApiTask
    | QueueItem
    | ConsoleEntry
    | { id: string }
    | { message: string };
}

export interface JsVmState {
  callStack: StackFrame[];
  heap: HeapObject[];
  webApis: WebApiTask[];
  callbackQueue: QueueItem[];
  microtaskQueue: QueueItem[];
  console: ConsoleEntry[];
  currentLine: number | null;
  currentStep: JsStep | null;
}

export const initialJsState: JsVmState = {
  callStack: [],
  heap: [],
  webApis: [],
  callbackQueue: [],
  microtaskQueue: [],
  console: [],
  currentLine: null,
  currentStep: null,
};

/** Apply a single step to the VM state immutably. */
export function applyJsStep(state: JsVmState, step: JsStep): JsVmState {
  const next: JsVmState = {
    ...state,
    callStack: [...state.callStack],
    heap: [...state.heap],
    webApis: [...state.webApis],
    callbackQueue: [...state.callbackQueue],
    microtaskQueue: [...state.microtaskQueue],
    console: [...state.console],
    currentLine: step.line,
    currentStep: step,
  };

  switch (step.kind) {
    case "push-stack":
      next.callStack.push(step.payload as StackFrame);
      break;
    case "pop-stack":
      next.callStack.pop();
      break;
    case "alloc-heap":
      next.heap.push(step.payload as HeapObject);
      break;
    case "free-heap": {
      const id = (step.payload as { id: string }).id;
      next.heap = next.heap.filter((h) => h.id !== id);
      break;
    }
    case "register-webapi":
      next.webApis.push(step.payload as WebApiTask);
      break;
    case "complete-webapi": {
      const id = (step.payload as { id: string }).id;
      next.webApis = next.webApis.filter((w) => w.id !== id);
      break;
    }
    case "enqueue-callback":
      next.callbackQueue.push(step.payload as QueueItem);
      break;
    case "enqueue-microtask":
      next.microtaskQueue.push(step.payload as QueueItem);
      break;
    case "dequeue-callback":
      next.callbackQueue.shift();
      break;
    case "dequeue-microtask":
      next.microtaskQueue.shift();
      break;
    case "console":
      next.console.push(step.payload as ConsoleEntry);
      break;
    case "note":
      break;
  }
  return next;
}

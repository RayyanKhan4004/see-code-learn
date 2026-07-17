// Real-time JavaScript tracer.
// Parses user code with acorn, instruments function entry/exit and statements,
// runs it inside a sandbox where setTimeout / Promise / queueMicrotask / console
// are patched to emit visualization steps, then returns the captured trace.

import { parse } from "acorn";
import { generate } from "astring";
import type { JsStep, ConsoleEntry, HeapObject, QueueItem, StackFrame, WebApiTask } from "../types";

// Acorn AST nodes are loosely typed; we keep the surface narrow on purpose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Acorn AST is intentionally untyped
type AnyNode = any;

let uid = 0;
const nid = (p: string) => `${p}-${++uid}-${Math.random().toString(36).slice(2, 6)}`;

interface Tracer {
  enter: (name: string, line: number) => void;
  exit: (line: number) => void;
  line: (line: number) => void;
  alloc: (kind: HeapObject["kind"], label: string, preview?: string) => void;
  log: (...args: unknown[]) => void;
  err: (msg: string, line: number) => void;
}

function fmt(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return v;
  if (typeof v === "function")
    return `ƒ ${(v as (...args: unknown[]) => unknown).name || "anonymous"}`;
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

/** Walk every nested node; mutate in place when the transformer returns one. */
function walk(
  node: AnyNode,
  parent: AnyNode | null,
  visit: (n: AnyNode, p: AnyNode | null) => void,
) {
  if (!node || typeof node !== "object") return;
  visit(node, parent);
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "start" || key === "end" || key === "range") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) walk(c, node, visit);
    } else if (child && typeof child === "object" && typeof child.type === "string") {
      walk(child, node, visit);
    }
  }
}

/** Build a CallExpression to `__t.<method>(...args)`. */
function tcall(method: string, args: AnyNode[]): AnyNode {
  return {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "MemberExpression",
        computed: false,
        optional: false,
        object: { type: "Identifier", name: "__t" },
        property: { type: "Identifier", name: method },
      },
      arguments: args,
    },
  };
}
const lit = (v: string | number) => ({ type: "Literal", value: v });

/** Instrument the program: wrap functions with enter/exit and prefix statements with line markers. */
function instrument(code: string): string {
  const ast: AnyNode = parse(code, {
    ecmaVersion: 2022,
    locations: true,
    sourceType: "script",
    allowReturnOutsideFunction: true,
  });

  walk(ast, null, (node, parent) => {
    // Wrap function bodies
    if (
      (node.type === "FunctionDeclaration" ||
        node.type === "FunctionExpression" ||
        node.type === "ArrowFunctionExpression") &&
      node.body &&
      node.body.type === "BlockStatement"
    ) {
      const line: number = node.loc?.start.line ?? 0;
      let name = "(anonymous)";
      if (node.id?.name) name = node.id.name;
      else if (parent?.type === "VariableDeclarator" && parent.id?.name) name = parent.id.name;
      else if (parent?.type === "Property" && parent.key?.name) name = parent.key.name;
      else if (parent?.type === "MethodDefinition" && parent.key?.name) name = parent.key.name;
      else if (parent?.type === "AssignmentExpression" && parent.left?.type === "Identifier")
        name = parent.left.name;
      if (node.type === "ArrowFunctionExpression" && name === "(anonymous)") name = "=>";

      const original = node.body.body;
      const endLine: number = node.body.loc?.end.line ?? line;
      node.body.body = [
        tcall("enter", [lit(name), lit(line)]),
        {
          type: "TryStatement",
          block: { type: "BlockStatement", body: original },
          handler: null,
          finalizer: { type: "BlockStatement", body: [tcall("exit", [lit(endLine)])] },
        },
      ];
    }
  });

  // Prefix top-level statements + statements inside blocks with line markers.
  function prefixBlock(body: AnyNode[]): AnyNode[] {
    const out: AnyNode[] = [];
    for (const stmt of body) {
      const line = stmt.loc?.start.line;
      if (
        line &&
        stmt.type !== "FunctionDeclaration" &&
        // skip the synthetic enter/try we already inserted
        !(
          stmt.type === "ExpressionStatement" &&
          stmt.expression?.type === "CallExpression" &&
          stmt.expression.callee?.object?.name === "__t"
        )
      ) {
        out.push(tcall("line", [lit(line)]));
      }
      out.push(stmt);

      // Alloc tracking for `const/let/var x = {...} | [...] | function`
      if (stmt.type === "VariableDeclaration") {
        for (const decl of stmt.declarations) {
          const init = decl.init;
          if (!init || decl.id?.type !== "Identifier") continue;
          let kind: HeapObject["kind"] | null = null;
          let preview = "";
          if (init.type === "ObjectExpression") {
            kind = "object";
            preview = `{${init.properties.length} keys}`;
          } else if (init.type === "ArrayExpression") {
            kind = "array";
            preview = `[${init.elements.length}]`;
          } else if (
            init.type === "FunctionExpression" ||
            init.type === "ArrowFunctionExpression"
          ) {
            kind = "function";
            preview = "ƒ";
          } else if (init.type === "NewExpression") {
            kind = "object";
            preview = `new ${init.callee?.name ?? "Object"}`;
          }
          if (kind) {
            out.push(tcall("alloc", [lit(kind), lit(decl.id.name), lit(preview)]));
          }
        }
      }
    }
    return out;
  }
  walk(ast, null, (node) => {
    if (node.type === "BlockStatement" || node.type === "Program") {
      node.body = prefixBlock(node.body);
    }
  });

  return generate(ast);
}

/** Run user code and return a stream of execution steps. */
export async function traceCode(code: string): Promise<JsStep[]> {
  const steps: JsStep[] = [];
  let stackDepth = 0;
  let currentLine = 1;

  const push = (s: JsStep) => steps.push(s);

  const tracer: Tracer = {
    enter: (name, line) => {
      stackDepth++;
      currentLine = line;
      const frame: StackFrame = { id: nid("f"), name: `${name}()` };
      push({
        kind: "push-stack",
        line,
        explanation: `Call ${name}() pushed onto the call stack`,
        why: "Each function invocation creates a new stack frame; the engine runs only the top frame.",
        concept: "Call Stack",
        payload: frame,
      });
    },
    exit: (line) => {
      stackDepth = Math.max(0, stackDepth - 1);
      currentLine = line;
      push({
        kind: "pop-stack",
        line,
        explanation: "Function returned — frame popped",
        why: "When a function returns (or throws) its frame is removed and control resumes the caller.",
        concept: "Call Stack",
      });
    },
    line: (line) => {
      currentLine = line;
      push({
        kind: "note",
        line,
        explanation: `Executing line ${line}`,
        why: "JavaScript runs statements sequentially in the current frame.",
        concept: "Execution",
      });
    },
    alloc: (kind, label, preview) => {
      const obj: HeapObject = { id: nid("h"), kind, label, preview };
      push({
        kind: "alloc-heap",
        line: currentLine,
        explanation: `Allocated ${kind} "${label}" on the heap`,
        why: "Objects, arrays and functions live in the heap; variables hold references to them.",
        concept: "Memory Heap",
        payload: obj,
      });
    },
    log: (...args) => {
      const entry: ConsoleEntry = { id: nid("c"), level: "log", message: args.map(fmt).join(" ") };
      push({
        kind: "console",
        line: currentLine,
        explanation: `console.log → ${entry.message}`,
        why: "console.log writes a value to the output stream from the current frame.",
        concept: "Console",
        payload: entry,
      });
    },
    err: (msg, line) => {
      const entry: ConsoleEntry = { id: nid("c"), level: "error", message: msg };
      push({
        kind: "console",
        line,
        explanation: `Runtime error: ${msg}`,
        why: "An uncaught exception bubbled up and was reported.",
        concept: "Error",
        payload: entry,
      });
    },
  };

  // ----- Sandbox globals -----
  const sandboxConsole = {
    log: (...a: unknown[]) => tracer.log(...a),
    info: (...a: unknown[]) => tracer.log(...a),
    warn: (...a: unknown[]) => tracer.log(...a),
    error: (...a: unknown[]) => tracer.log(...a),
  };

  const pending: Promise<unknown>[] = [];

  function sandboxSetTimeout(cb: () => void, ms = 0): number {
    const id = nid("w");
    const label = `setTimeout ${ms}ms`;
    push({
      kind: "register-webapi",
      line: currentLine,
      explanation: `setTimeout(${ms}) registered with Web APIs`,
      why: "Timers don't block the stack — the browser tracks them outside the JS engine.",
      concept: "Web APIs",
      payload: { id, label } as WebApiTask,
    });
    const p = new Promise<void>((resolve) => {
      // Cap real wait so tracing finishes quickly; preserves ordering.
      const wait = Math.min(ms, 50);
      setTimeout(() => {
        push({
          kind: "complete-webapi",
          line: currentLine,
          explanation: "Timer elapsed — moving callback to Callback Queue",
          why: "Once the Web API finishes, its callback is queued as a macrotask.",
          concept: "Event Loop",
          payload: { id },
        });
        const qi: QueueItem = { id: nid("q"), label: "setTimeout cb" };
        push({
          kind: "enqueue-callback",
          line: currentLine,
          explanation: "Callback enqueued (macrotask)",
          why: "Macrotasks run one per tick, only when the call stack is empty.",
          concept: "Callback Queue",
          payload: qi,
        });
        // Run callback after current sync chunk: drain microtasks first by deferring.
        Promise.resolve().then(() => {
          push({
            kind: "dequeue-callback",
            line: currentLine,
            explanation: "Event loop pulled callback off the queue",
            why: "Stack is empty → event loop pushes the next macrotask onto the stack.",
            concept: "Event Loop",
          });
          try {
            cb();
          } catch (e) {
            tracer.err((e as Error).message, currentLine);
          }
          resolve();
        });
      }, wait);
    });
    pending.push(p);
    return 0;
  }

  function sandboxQueueMicrotask(cb: () => void) {
    const qi: QueueItem = { id: nid("m"), label: "microtask" };
    push({
      kind: "enqueue-microtask",
      line: currentLine,
      explanation: "queueMicrotask scheduled",
      why: "Microtasks are drained completely before the next macrotask.",
      concept: "Microtask Queue",
      payload: qi,
    });
    const p = Promise.resolve().then(() => {
      push({
        kind: "dequeue-microtask",
        line: currentLine,
        explanation: "Microtask dispatched",
        why: "All pending microtasks run before returning to the event loop.",
        concept: "Microtask Queue",
      });
      try {
        cb();
      } catch (e) {
        tracer.err((e as Error).message, currentLine);
      }
    });
    pending.push(p);
  }

  // Patch Promise so .then callbacks emit microtask steps.
  const NativePromise = Promise;
  class TracedPromise<T> extends NativePromise<T> {
    then<TResult1 = T, TResult2 = never>(
      onF?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
      onR?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
    ): Promise<TResult1 | TResult2> {
      const wrap = <V, R>(label: string, fn?: ((v: V) => R) | null) =>
        fn
          ? (v: V) => {
              const qi: QueueItem = { id: nid("m"), label };
              push({
                kind: "enqueue-microtask",
                line: currentLine,
                explanation: `Promise ${label} queued`,
                why: "Promise reactions are microtasks — they run before any macrotask.",
                concept: "Microtask Queue",
                payload: qi,
              });
              push({
                kind: "dequeue-microtask",
                line: currentLine,
                explanation: `Running ${label}`,
                why: "Microtask drained from the queue.",
                concept: "Microtask Queue",
              });
              return fn(v);
            }
          : fn;
      return super.then(wrap(".then", onF as never), wrap(".catch", onR as never)) as Promise<
        TResult1 | TResult2
      >;
    }
  }

  // ----- Run -----
  let instrumented: string;
  try {
    instrumented = instrument(code);
  } catch (e) {
    tracer.err(`Parse error: ${(e as Error).message}`, 1);
    return steps;
  }

  try {
    const fn = new Function(
      "__t",
      "console",
      "setTimeout",
      "queueMicrotask",
      "Promise",
      `"use strict";\n${instrumented}`,
    );
    fn(tracer, sandboxConsole, sandboxSetTimeout, sandboxQueueMicrotask, TracedPromise);
  } catch (e) {
    tracer.err((e as Error).message, currentLine);
  }

  // Drain timers/microtasks (with a hard cap).
  const start = Date.now();
  while (pending.length && Date.now() - start < 2000) {
    const snapshot = pending.splice(0, pending.length);
    await Promise.allSettled(snapshot);
  }

  return steps;
}

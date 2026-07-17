import type { ExampleProgram, JsStep, VisualizerModule } from "../types";

// Helper builders to keep example traces concise.
const push = (
  name: string,
  line: number,
  explanation: string,
  why: string,
  concept = "Call Stack",
): JsStep => ({
  kind: "push-stack",
  line,
  explanation,
  why,
  concept,
  payload: { id: `${name}-${line}-${Math.random().toString(36).slice(2, 6)}`, name },
});
const pop = (line: number, explanation: string, why: string, concept = "Call Stack"): JsStep => ({
  kind: "pop-stack",
  line,
  explanation,
  why,
  concept,
});
const log = (msg: string, line: number, explanation: string, why: string): JsStep => ({
  kind: "console",
  line,
  explanation,
  why,
  concept: "Console Output",
  payload: { id: `log-${Math.random().toString(36).slice(2, 6)}`, level: "log", message: msg },
});
const alloc = (
  id: string,
  label: string,
  kind: "object" | "function" | "array" | "closure",
  line: number,
  explanation: string,
  why: string,
  preview?: string,
): JsStep => ({
  kind: "alloc-heap",
  line,
  explanation,
  why,
  concept: "Memory Heap",
  payload: { id, label, kind, preview },
});

/* ---------------- Variables ---------------- */
const variables: ExampleProgram<JsStep> = {
  id: "variables",
  title: "Variables",
  concept: "Variables & Memory",
  description: "Primitives live on the stack, objects live on the heap.",
  code: `let count = 42;\nlet name = "Lovable";\nlet user = { id: 1, role: "admin" };\nconsole.log(user);`,
  trace: [
    {
      kind: "note",
      line: 1,
      explanation: "Declaring primitive `count = 42`",
      why: "Primitives are stored by value in the variable environment.",
      concept: "Execution Context",
    },
    {
      kind: "note",
      line: 2,
      explanation: 'Declaring primitive `name = "Lovable"`',
      why: "Strings are immutable primitives in JavaScript.",
      concept: "Execution Context",
    },
    alloc(
      "u1",
      "user { id, role }",
      "object",
      3,
      "Allocating object on the heap",
      "Objects are reference types — the variable holds a pointer.",
      "{ id: 1, role: 'admin' }",
    ),
    push(
      "console.log",
      4,
      "Calling console.log(user)",
      "Function invocation pushes a frame onto the call stack.",
    ),
    log(
      "{ id: 1, role: 'admin' }",
      4,
      "Logging the object",
      "console.log reads from the heap via the reference stored in `user`.",
    ),
    pop(4, "console.log returns", "Frame is popped once execution finishes."),
  ],
};

/* ---------------- Functions ---------------- */
const functions: ExampleProgram<JsStep> = {
  id: "functions",
  title: "Functions & Call Stack",
  concept: "Call Stack",
  description: "Each function call pushes a frame; returning pops it.",
  code: `function multiply(a, b) {\n  return a * b;\n}\nfunction square(n) {\n  return multiply(n, n);\n}\nconsole.log(square(5));`,
  trace: [
    push(
      "(script)",
      1,
      "Global execution context created",
      "The script itself runs in the global frame.",
      "Execution Context",
    ),
    push(
      "console.log",
      6,
      "Evaluating arguments to console.log",
      "Arguments must be evaluated before the call.",
    ),
    push("square(5)", 6, "Calling square(5)", "A new frame is pushed for square."),
    push(
      "multiply(5, 5)",
      5,
      "square calls multiply(5, 5)",
      "Nested calls stack on top — LIFO order.",
    ),
    pop(5, "multiply returns 25", "Innermost frame pops first."),
    pop(6, "square returns 25", "Control returns to caller."),
    log("25", 6, "console.log prints 25", "The resolved value is passed in."),
    pop(6, "console.log returns", "Stack frame removed."),
    pop(6, "Script complete", "Global context exits."),
  ],
};

/* ---------------- Closures ---------------- */
const closures: ExampleProgram<JsStep> = {
  id: "closures",
  title: "Closures",
  concept: "Closures & Scope",
  description: "Inner functions remember the scope they were defined in.",
  code: `function makeCounter() {\n  let count = 0;\n  return function () {\n    count++;\n    return count;\n  };\n}\nconst counter = makeCounter();\nconsole.log(counter());\nconsole.log(counter());`,
  trace: [
    push(
      "makeCounter",
      8,
      "Calling makeCounter()",
      "Creates a new execution context.",
      "Execution Context",
    ),
    alloc(
      "env1",
      "[[Scope]] { count: 0 }",
      "closure",
      2,
      "Allocating closure environment",
      "The inner function captures this environment.",
      "count = 0",
    ),
    alloc(
      "fn1",
      "counter (closure)",
      "function",
      3,
      "Returning inner function",
      "The function keeps a reference to its lexical environment.",
      "() => { count++; return count; }",
    ),
    pop(7, "makeCounter returns", "But its environment lives on — referenced by the closure."),
    push("counter", 9, "Calling counter()", "Invokes the inner function."),
    log("1", 9, "count becomes 1, returns 1", "Closure mutates the captured `count`."),
    pop(9, "counter returns", ""),
    push("counter", 10, "Calling counter() again", "Same closure, same environment."),
    log(
      "2",
      10,
      "count becomes 2, returns 2",
      "State persists across calls — the magic of closures.",
    ),
    pop(10, "counter returns", ""),
  ],
};

/* ---------------- Hoisting ---------------- */
const hoisting: ExampleProgram<JsStep> = {
  id: "hoisting",
  title: "Hoisting",
  concept: "Hoisting",
  description: "`var` and function declarations are hoisted to the top of their scope.",
  code: `console.log(typeof greet);\nconsole.log(x);\nvar x = 5;\nfunction greet() {\n  return "hi";\n}`,
  trace: [
    {
      kind: "note",
      line: 0,
      explanation: "Creation phase: scan for declarations",
      why: "Before execution, JS allocates `var x = undefined` and the full `greet` function.",
      concept: "Hoisting",
    },
    alloc(
      "greetFn",
      "greet()",
      "function",
      4,
      "Function `greet` hoisted fully",
      "Function declarations are available before their textual position.",
      'function greet() { return "hi"; }',
    ),
    push("console.log", 1, "Logging typeof greet", "Function is already in scope."),
    log(
      '"function"',
      1,
      "typeof greet is 'function'",
      "Because `greet` was hoisted with its body.",
    ),
    pop(1, "console.log returns", ""),
    push(
      "console.log",
      2,
      "Logging x",
      "`var x` was hoisted but only the declaration, not the value.",
    ),
    log(
      "undefined",
      2,
      "x is undefined",
      "var declarations default to undefined until assignment runs.",
    ),
    pop(2, "console.log returns", ""),
    {
      kind: "note",
      line: 3,
      explanation: "Now `x = 5` executes",
      why: "Assignment happens at the textual line, not at hoist time.",
      concept: "Hoisting",
    },
  ],
};

/* ---------------- Event Loop / setTimeout ---------------- */
const eventLoop: ExampleProgram<JsStep> = {
  id: "event-loop",
  title: "Event Loop & setTimeout",
  concept: "Event Loop",
  description: "Sync first, then microtasks, then callbacks.",
  code: `console.log("A");\nsetTimeout(() => console.log("B"), 0);\nconsole.log("C");`,
  trace: [
    push("console.log", 1, "console.log('A')", "Sync call — goes straight on the stack."),
    log("A", 1, "Prints A", "Synchronous output appears immediately."),
    pop(1, "Returns", ""),
    push(
      "setTimeout",
      2,
      "Calling setTimeout",
      "setTimeout itself is a synchronous call to a Web API.",
    ),
    {
      kind: "register-webapi",
      line: 2,
      explanation: "Timer handed off to Web API",
      why: "Timers run outside the JS engine in the browser/runtime.",
      concept: "Web APIs",
      payload: { id: "t1", label: "setTimeout 0ms" },
    },
    pop(2, "setTimeout returns immediately", "It only registers the timer."),
    push("console.log", 3, "console.log('C')", "Next sync line executes."),
    log("C", 3, "Prints C", "C runs before B — sync always beats async."),
    pop(3, "Returns", ""),
    {
      kind: "complete-webapi",
      line: 2,
      explanation: "Timer fires after 0ms",
      why: "The Web API moves the callback to the callback (macrotask) queue.",
      concept: "Web APIs",
      payload: { id: "t1" },
    },
    {
      kind: "enqueue-callback",
      line: 2,
      explanation: "Callback queued",
      why: "Waiting for the event loop to drain the call stack.",
      concept: "Callback Queue",
      payload: { id: "cb1", label: "() => console.log('B')" },
    },
    {
      kind: "dequeue-callback",
      line: 2,
      explanation: "Stack empty — event loop picks the callback",
      why: "The event loop only runs queued callbacks when the stack is empty.",
      concept: "Event Loop",
    },
    push(
      "(anonymous)",
      2,
      "Callback pushed onto the stack",
      "Now it executes like a normal function.",
    ),
    push("console.log", 2, "console.log('B')", ""),
    log("B", 2, "Prints B", "Finally — the deferred output."),
    pop(2, "Returns", ""),
    pop(2, "Callback returns", ""),
  ],
};

/* ---------------- Promises / Microtasks ---------------- */
const promises: ExampleProgram<JsStep> = {
  id: "promises",
  title: "Promises & Microtasks",
  concept: "Microtask Queue",
  description: "Microtasks (Promise.then) run before macrotasks (setTimeout).",
  code: `console.log("start");\nsetTimeout(() => console.log("timeout"), 0);\nPromise.resolve().then(() => console.log("promise"));\nconsole.log("end");`,
  trace: [
    push("console.log", 1, "console.log('start')", "Sync."),
    log("start", 1, "Prints start", ""),
    pop(1, "Returns", ""),
    {
      kind: "register-webapi",
      line: 2,
      explanation: "setTimeout registered with Web API",
      why: "Timer is offloaded.",
      concept: "Web APIs",
      payload: { id: "t1", label: "setTimeout 0ms" },
    },
    {
      kind: "enqueue-microtask",
      line: 3,
      explanation: "Promise.then handler queued as microtask",
      why: "Promise reactions always go to the microtask queue.",
      concept: "Microtask Queue",
      payload: { id: "m1", label: "() => console.log('promise')" },
    },
    push("console.log", 4, "console.log('end')", "Sync."),
    log("end", 4, "Prints end", ""),
    pop(4, "Returns", ""),
    {
      kind: "complete-webapi",
      line: 2,
      explanation: "Timer fires, callback queued",
      why: "Moves to the callback (macrotask) queue.",
      concept: "Web APIs",
      payload: { id: "t1" },
    },
    {
      kind: "enqueue-callback",
      line: 2,
      explanation: "Timer callback queued",
      why: "Waits behind microtasks.",
      concept: "Callback Queue",
      payload: { id: "cb1", label: "() => console.log('timeout')" },
    },
    {
      kind: "dequeue-microtask",
      line: 3,
      explanation: "Event loop drains ALL microtasks first",
      why: "Microtasks always run before the next macrotask.",
      concept: "Event Loop",
    },
    push("(microtask)", 3, "Microtask runs", ""),
    log("promise", 3, "Prints promise", "Microtasks always beat timers, even 0ms ones."),
    pop(3, "Returns", ""),
    {
      kind: "dequeue-callback",
      line: 2,
      explanation: "Now the timer callback runs",
      why: "Macrotask queue drained one at a time, after microtasks.",
      concept: "Event Loop",
    },
    push("(timer)", 2, "Timer callback runs", ""),
    log("timeout", 2, "Prints timeout", ""),
    pop(2, "Returns", ""),
  ],
};

/* ---------------- Async / Await ---------------- */
const asyncAwait: ExampleProgram<JsStep> = {
  id: "async-await",
  title: "Async / Await",
  concept: "Async functions",
  description: "`await` pauses the function and resumes it as a microtask.",
  code: `async function load() {\n  console.log("1");\n  await Promise.resolve();\n  console.log("3");\n}\nload();\nconsole.log("2");`,
  trace: [
    push(
      "load",
      6,
      "Calling load()",
      "Async functions run synchronously until the first await.",
      "Call Stack",
    ),
    push("console.log", 2, "console.log('1')", ""),
    log("1", 2, "Prints 1", ""),
    pop(2, "Returns", ""),
    {
      kind: "enqueue-microtask",
      line: 3,
      explanation: "await suspends load(); continuation queued as microtask",
      why: "Awaiting an already-resolved promise still defers via the microtask queue.",
      concept: "Microtask Queue",
      payload: { id: "m1", label: "resume load() after await" },
    },
    pop(3, "load() pauses and returns a pending Promise", "Async function yields control."),
    push("console.log", 7, "console.log('2')", ""),
    log("2", 7, "Prints 2", "Sync code after load() runs before the continuation."),
    pop(7, "Returns", ""),
    {
      kind: "dequeue-microtask",
      line: 3,
      explanation: "Stack empty — microtask runs",
      why: "Resumes load() right where it paused.",
      concept: "Event Loop",
    },
    push("load (resumed)", 3, "Resuming load()", ""),
    push("console.log", 4, "console.log('3')", ""),
    log("3", 4, "Prints 3", ""),
    pop(4, "Returns", ""),
    pop(4, "load() completes", ""),
  ],
};

/* ---------------- Scope ---------------- */
const scope: ExampleProgram<JsStep> = {
  id: "scope",
  title: "Lexical Scope",
  concept: "Scope",
  description: "Inner scopes can read outer variables — not the other way around.",
  code: `const outer = "I am outer";\nfunction inner() {\n  console.log(outer);\n}\ninner();`,
  trace: [
    {
      kind: "note",
      line: 1,
      explanation: "Global variable `outer` defined",
      why: "Lives in the global environment.",
      concept: "Scope",
    },
    push("inner", 5, "Calling inner()", "", "Call Stack"),
    push("console.log", 3, "console.log(outer)", ""),
    {
      kind: "note",
      line: 3,
      explanation: "Identifier `outer` not found in local scope — walking up",
      why: "JS uses lexical scoping: it walks the scope chain to its definition site.",
      concept: "Scope Chain",
    },
    log('"I am outer"', 3, "Found in global scope", ""),
    pop(3, "Returns", ""),
    pop(3, "inner returns", ""),
  ],
};

/* ---------------- Memory Allocation ---------------- */
const memory: ExampleProgram<JsStep> = {
  id: "memory",
  title: "Memory Allocation",
  concept: "Heap & Stack",
  description: "Primitives on the stack, references on the heap.",
  code: `const a = 10;\nconst b = a;\nconst obj = { value: 1 };\nconst ref = obj;\nref.value = 99;\nconsole.log(obj.value);`,
  trace: [
    {
      kind: "note",
      line: 1,
      explanation: "a = 10 stored by value",
      why: "Primitives are copied by value.",
      concept: "Stack",
    },
    {
      kind: "note",
      line: 2,
      explanation: "b = a — value 10 copied",
      why: "Changing b later wouldn't affect a.",
      concept: "Stack",
    },
    alloc(
      "o1",
      "{ value: 1 }",
      "object",
      3,
      "Object allocated on heap",
      "`obj` holds a pointer to it.",
      "{ value: 1 }",
    ),
    {
      kind: "note",
      line: 4,
      explanation: "ref = obj — pointer copied",
      why: "Both variables point to the SAME heap object.",
      concept: "Heap",
    },
    {
      kind: "note",
      line: 5,
      explanation: "ref.value = 99 mutates the heap object",
      why: "Because obj and ref share the same reference.",
      concept: "Heap",
    },
    push("console.log", 6, "Logging obj.value", "", "Call Stack"),
    log("99", 6, "Prints 99 (not 1!)", "Reference semantics in action."),
    pop(6, "Returns", ""),
  ],
};

/* ---------------- Garbage Collection ---------------- */
const gc: ExampleProgram<JsStep> = {
  id: "gc",
  title: "Garbage Collection",
  concept: "Garbage Collection",
  description: "Unreachable objects get reclaimed automatically.",
  code: `let user = { name: "Ada" };\nuser = null;\n// the object is now unreachable`,
  trace: [
    alloc(
      "u1",
      "{ name: 'Ada' }",
      "object",
      1,
      "Allocate user object on heap",
      "Reference held by `user`.",
      "{ name: 'Ada' }",
    ),
    {
      kind: "note",
      line: 2,
      explanation: "user = null — reference dropped",
      why: "Nothing in the program reaches the object anymore.",
      concept: "Garbage Collection",
    },
    {
      kind: "free-heap",
      line: 3,
      explanation: "Garbage collector reclaims memory",
      why: "Mark-and-sweep finds the object is unreachable and frees it.",
      concept: "Garbage Collection",
      payload: { id: "u1" },
    },
  ],
};

export const javascriptModule: VisualizerModule<JsStep> = {
  id: "javascript",
  name: "JavaScript",
  description: "Visualize the JS runtime: call stack, heap, event loop, queues.",
  examples: [
    variables,
    functions,
    closures,
    scope,
    hoisting,
    eventLoop,
    promises,
    asyncAwait,
    memory,
    gc,
  ],
};

import type { ReactExample, ReactStep } from "./types";

// Helper builders to keep examples readable.
const mount = (
  id: string,
  name: string,
  parentId: string | null,
  props: Record<string, unknown> = {},
  state: Record<string, unknown> = {},
  memo = false,
): ReactStep => ({
  kind: "mount",
  explanation: `<${name}/> mounts under ${parentId ?? "root"}.`,
  why: "React creates the fiber, initializes hooks, and runs the component for the first time.",
  concept: "Mounting",
  payload: { id, name, parentId, props, state, memo },
});
const render = (id: string, reason: string, durationMs = 2): ReactStep => ({
  kind: "render",
  explanation: `Re-render of #${id} (${reason}).`,
  why: "React calls the component function again to compute its next virtual DOM.",
  concept: "Render phase",
  payload: { id, reason, durationMs },
});
const skip = (id: string, reason = "props-changed"): ReactStep => ({
  kind: "skip-render",
  explanation: `#${id} skipped — memo says props are equal.`,
  why: "React.memo / useMemo / useCallback stop unnecessary work when inputs haven't changed.",
  concept: "Bailout",
  payload: { id, reason },
});
const setState = (id: string, state: Record<string, unknown>, explanation: string): ReactStep => ({
  kind: "set-state",
  explanation,
  why: "A setState call schedules a re-render of this component and its descendants.",
  concept: "State updates",
  payload: { id, state },
});
const updateProps = (
  id: string,
  props: Record<string, unknown>,
  explanation: string,
): ReactStep => ({
  kind: "update-props",
  explanation,
  why: "Parent passed new props; React reconciles and may re-render the child.",
  concept: "Props changes",
  payload: { id, props },
});
const note = (explanation: string, concept = "Concept"): ReactStep => ({
  kind: "note",
  explanation,
  why: "Conceptual checkpoint.",
  concept,
  payload: {},
});

const componentTreeExample: ReactExample = {
  id: "tree-mount",
  title: "Component tree & first render",
  concept: "Mounting",
  description: "Watch React build the fiber tree top-down on the first render.",
  code: `function App() {
  return (
    <Layout>
      <Header />
      <Main>
        <Counter />
      </Main>
    </Layout>
  );
}`,
  trace: [
    note("React starts at the root and walks down the tree.", "Reconciliation"),
    mount("app", "App", null),
    render("app", "initial"),
    mount("layout", "Layout", "app"),
    render("layout", "initial"),
    mount("header", "Header", "layout"),
    render("header", "initial"),
    mount("main", "Main", "layout"),
    render("main", "initial"),
    mount("counter", "Counter", "main", {}, { count: 0 }),
    render("counter", "initial"),
    note("All children mounted. React commits the DOM.", "Commit phase"),
  ],
};

const rerenderExample: ReactExample = {
  id: "rerender-cascade",
  title: "Re-render cascade",
  concept: "Re-render tracking",
  description: "A setState in a parent re-renders the parent AND every child by default.",
  code: `function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <Child label="static" />
      <Sibling value={count} />
    </>
  );
}`,
  trace: [
    mount("parent", "Parent", null, {}, { count: 0 }),
    render("parent", "initial"),
    mount("child", "Child", "parent", { label: "static" }),
    render("child", "initial"),
    mount("sibling", "Sibling", "parent", { value: 0 }),
    render("sibling", "initial"),
    note("User clicks the button.", "Event"),
    setState("parent", { count: 1 }, "setCount(1) — Parent will re-render."),
    render("parent", "state-changed", 3),
    note(
      "React keeps walking — children re-render too, even when props are equal by value.",
      "Default behavior",
    ),
    updateProps("child", { label: "static" }, "Child receives the SAME props as before."),
    render("child", "parent-render", 1),
    updateProps("sibling", { value: 1 }, "Sibling receives a new value prop."),
    render("sibling", "props-changed", 2),
  ],
};

const memoExample: ReactExample = {
  id: "react-memo",
  title: "React.memo bailout",
  concept: "React.memo",
  description:
    "Wrapping Child in React.memo lets React skip its render when props are shallow-equal.",
  code: `const Child = React.memo(function Child({ label }) {
  return <span>{label}</span>;
});

function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <Child label="static" />
    </>
  );
}`,
  trace: [
    mount("parent", "Parent", null, {}, { count: 0 }),
    render("parent", "initial"),
    mount("child", "Child", "parent", { label: "static" }, {}, true),
    render("child", "initial"),
    note("Click — only Parent's state changes.", "Event"),
    setState("parent", { count: 1 }, "setCount(1) — Parent re-renders."),
    render("parent", "state-changed", 3),
    note("React compares Child's previous props to its new props.", "Shallow compare"),
    skip("child", "props-changed"),
    note("Child render skipped — its DOM is untouched.", "Bailout"),
  ],
};

const useCallbackExample: ReactExample = {
  id: "usecallback-bust",
  title: "useCallback: stable function identity",
  concept: "useCallback",
  description: "Without useCallback, a new function each render busts React.memo on the child.",
  code: `const Child = React.memo(function Child({ onClick }) {
  return <button onClick={onClick}>child</button>;
});

function Parent() {
  const [count, setCount] = useState(0);
  // ❌ new function every render
  const onClick = () => console.log("click");
  // ✅ stable across renders
  // const onClick = useCallback(() => console.log("click"), []);
  return <Child onClick={onClick} />;
}`,
  trace: [
    mount("parent", "Parent", null, {}, { count: 0 }),
    render("parent", "initial"),
    mount("child", "Child", "parent", { onClick: "fn#1" }, {}, true),
    render("child", "initial"),
    setState("parent", { count: 1 }, "setCount(1) — Parent re-renders, recreates onClick."),
    render("parent", "state-changed", 3),
    updateProps("child", { onClick: "fn#2" }, "Child receives a NEW function reference."),
    note("Shallow compare sees a different prop — memo can't bail out.", "Memo miss"),
    render("child", "props-changed", 1),
    note(
      "Wrap onClick in useCallback(() => …, []) so its identity is stable and Child skips.",
      "Fix",
    ),
  ],
};

export const reactExamples: ReactExample[] = [
  componentTreeExample,
  rerenderExample,
  memoExample,
  useCallbackExample,
];

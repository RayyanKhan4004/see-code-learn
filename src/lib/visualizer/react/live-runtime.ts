// Live React runtime: compiles user TSX/JSX with @babel/standalone and returns
// a Root component we can render inside a Profiler. All React hooks are
// injected into scope so user code doesn't need imports.
import * as Babel from "@babel/standalone";
import * as React from "react";
import type { ComponentType } from "react";

export interface CompileResult {
  Root: ComponentType;
  componentNames: string[];
}

export interface RuntimeHooks {
  onStateChange: (component: string, hookIndex: number, prev: unknown, next: unknown) => void;
  onLog: (level: "log" | "warn" | "error", args: unknown[]) => void;
}

export function compileUserCode(source: string, hooks: RuntimeHooks): CompileResult {
  const transformed = Babel.transform(source, {
    presets: [
      ["react", { runtime: "classic" }],
      ["typescript", { allExtensions: true, isTSX: true, onlyRemoveTypeImports: true }],
    ],
    filename: "user-code.tsx",
  }).code;

  if (!transformed) throw new Error("Babel produced no output");

  // Track which component is currently rendering so useState logs can attribute.
  const currentComponentRef = { name: "<unknown>", hookIdx: 0 };

  const WrappedUseState = <T>(initial: T | (() => T)) => {
    const idx = currentComponentRef.hookIdx++;
    const componentName = currentComponentRef.name;
    const [value, setValue] = React.useState<T>(initial);
    const setter = React.useCallback(
      (next: T | ((prev: T) => T)) => {
        setValue((prev) => {
          const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
          if (!Object.is(prev, resolved)) {
            hooks.onStateChange(componentName, idx, prev, resolved);
          }
          return resolved;
        });
      },
      [componentName, idx],
    );
    return [value, setter] as const;
  };

  const wrappedConsole = {
    log: (...args: unknown[]) => hooks.onLog("log", args),
    warn: (...args: unknown[]) => hooks.onLog("warn", args),
    error: (...args: unknown[]) => hooks.onLog("error", args),
    info: (...args: unknown[]) => hooks.onLog("log", args),
  };

  // Expose hooks & helpers by name in scope so user code doesn't need imports.
  const scope: Record<string, unknown> = {
    React,
    useState: WrappedUseState,
    useEffect: React.useEffect,
    useMemo: React.useMemo,
    useCallback: React.useCallback,
    useRef: React.useRef,
    useReducer: React.useReducer,
    memo: React.memo,
    Fragment: React.Fragment,
    console: wrappedConsole,
    __setCurrent: (name: string) => {
      currentComponentRef.name = name;
      currentComponentRef.hookIdx = 0;
    },
  };

  // Collect declared function/const component names from the source so we can
  // return a Root. We accept `App` or the first PascalCase identifier declared.
  const componentNames = extractPascalCaseTopLevel(source);

  // Wrap the transformed code so each top-level component call is tagged with
  // its name via __setCurrent(). We use a light-weight wrapper: rebind each
  // component to a function that sets current then invokes it.
  const wrapperTail = `
    const __components = { ${componentNames.map((n) => `${n}: typeof ${n} !== 'undefined' ? ${n} : undefined`).join(",")} };
    for (const __k of Object.keys(__components)) {
      const __C = __components[__k];
      if (typeof __C === 'function') {
        const __Wrapped = function(props) { __setCurrent(__k); return __C(props); };
        Object.defineProperty(__Wrapped, 'name', { value: __k });
        __components[__k] = __Wrapped;
      }
    }
    return __components;
  `;

  const factory = new Function(...Object.keys(scope), `${transformed}\n${wrapperTail}`);

  const exported = factory(...Object.values(scope)) as Record<string, ComponentType | undefined>;

  const RootName = exported.App
    ? "App"
    : (componentNames.find((n) => typeof exported[n] === "function") ?? "App");

  const Root = exported[RootName];
  if (!Root) {
    throw new Error(
      `No component named "App" (or any PascalCase function component) was found in your code.`,
    );
  }

  return { Root, componentNames: Object.keys(exported).filter((k) => exported[k]) };
}

function extractPascalCaseTopLevel(src: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /(?:^|\n)\s*function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g,
    /(?:^|\n)\s*const\s+([A-Z][A-Za-z0-9_]*)\s*=/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) names.add(m[1]);
  }
  return [...names];
}

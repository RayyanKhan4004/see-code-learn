import { type OnMount } from "@monaco-editor/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { usePlayground } from "@/store/playground";

const Editor = lazy(() => import("@monaco-editor/react").then((m) => ({ default: m.default })));

export function CodeEditor() {
  const code = usePlayground((s) => s.code);
  const setCode = usePlayground((s) => s.setCode);
  const currentLine = usePlayground((s) => s.vm.currentLine);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme("codevision-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1a1f2e",
        "editor.lineHighlightBackground": "#243044",
        "editorLineNumber.foreground": "#4a5568",
      },
    });
    monaco.editor.setTheme("codevision-dark");
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    if (currentLine == null || currentLine < 1) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(currentLine, 1, currentLine, 1),
        options: {
          isWholeLine: true,
          className: "cv-active-line",
          glyphMarginClassName: "cv-active-glyph",
        },
      },
    ]);
    editor.revealLineInCenterIfOutsideViewport(currentLine);
  }, [currentLine]);

  return (
    <div className="h-full overflow-hidden rounded-lg border border-border bg-[#1a1f2e]">
      <style>{`
        .cv-active-line { background: rgba(56, 189, 248, 0.18) !important; }
        .cv-active-glyph { background: rgb(56, 189, 248); width: 3px !important; margin-left: 4px; }
      `}</style>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={code}
        onChange={(v) => setCode(v ?? "")}
        onMount={onMount}
        options={{
          fontSize: 13,
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          smoothScrolling: true,
          renderLineHighlight: "none",
          glyphMargin: true,
          lineNumbersMinChars: 3,
        }}
      />
    </div>
  );
}

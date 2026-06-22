// React render-cycle visualizer model.
// Models component tree, renders, prop/state changes, and memoization decisions.

export type ReactStepKind =
  | "mount"
  | "unmount"
  | "render"
  | "skip-render"
  | "set-state"
  | "update-props"
  | "memo-hit"
  | "memo-miss"
  | "effect-run"
  | "effect-cleanup"
  | "note";

export type RenderReason =
  | "initial"
  | "parent-render"
  | "state-changed"
  | "props-changed"
  | "context-changed"
  | "force";

export interface ComponentNode {
  id: string;
  name: string;
  parentId: string | null;
  props: Record<string, unknown>;
  state: Record<string, unknown>;
  memo?: boolean;
  renderCount: number;
  lastRenderMs?: number;
  lastReason?: RenderReason;
  skippedCount: number;
}

export interface RenderEvent {
  id: string;
  nodeId: string;
  name: string;
  reason: RenderReason;
  skipped: boolean;
  durationMs: number;
}

export interface ReactStep {
  kind: ReactStepKind;
  explanation: string;
  why: string;
  concept: string;
  payload?: any;
}

export interface ReactVmState {
  nodes: ComponentNode[];
  renderLog: RenderEvent[];
  currentStep: ReactStep | null;
  highlightId: string | null;
  totalRenders: number;
  totalSkipped: number;
}

export const initialReactState: ReactVmState = {
  nodes: [],
  renderLog: [],
  currentStep: null,
  highlightId: null,
  totalRenders: 0,
  totalSkipped: 0,
};

function upsertNode(nodes: ComponentNode[], node: ComponentNode): ComponentNode[] {
  const idx = nodes.findIndex((n) => n.id === node.id);
  if (idx === -1) return [...nodes, node];
  const next = [...nodes];
  next[idx] = { ...next[idx], ...node };
  return next;
}

function patchNode(nodes: ComponentNode[], id: string, patch: Partial<ComponentNode>): ComponentNode[] {
  return nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
}

export function applyReactStep(state: ReactVmState, step: ReactStep): ReactVmState {
  const next: ReactVmState = {
    ...state,
    nodes: [...state.nodes],
    renderLog: [...state.renderLog],
    currentStep: step,
    highlightId: state.highlightId,
  };

  switch (step.kind) {
    case "mount": {
      const node: ComponentNode = {
        id: step.payload.id,
        name: step.payload.name,
        parentId: step.payload.parentId ?? null,
        props: step.payload.props ?? {},
        state: step.payload.state ?? {},
        memo: !!step.payload.memo,
        renderCount: 0,
        skippedCount: 0,
      };
      next.nodes = upsertNode(next.nodes, node);
      next.highlightId = node.id;
      break;
    }
    case "unmount": {
      next.nodes = next.nodes.filter((n) => n.id !== step.payload.id);
      next.highlightId = null;
      break;
    }
    case "render": {
      const { id, reason = "parent-render", durationMs = 1 } = step.payload;
      const node = next.nodes.find((n) => n.id === id);
      if (node) {
        next.nodes = patchNode(next.nodes, id, {
          renderCount: node.renderCount + 1,
          lastRenderMs: durationMs,
          lastReason: reason,
        });
      }
      next.renderLog = [
        ...next.renderLog,
        {
          id: `re-${next.renderLog.length + 1}`,
          nodeId: id,
          name: node?.name ?? id,
          reason,
          skipped: false,
          durationMs,
        },
      ];
      next.totalRenders += 1;
      next.highlightId = id;
      break;
    }
    case "skip-render":
    case "memo-hit": {
      const { id, reason = "props-changed" } = step.payload;
      const node = next.nodes.find((n) => n.id === id);
      if (node) {
        next.nodes = patchNode(next.nodes, id, { skippedCount: node.skippedCount + 1 });
      }
      next.renderLog = [
        ...next.renderLog,
        {
          id: `re-${next.renderLog.length + 1}`,
          nodeId: id,
          name: node?.name ?? id,
          reason,
          skipped: true,
          durationMs: 0,
        },
      ];
      next.totalSkipped += 1;
      next.highlightId = id;
      break;
    }
    case "memo-miss":
      next.highlightId = step.payload.id;
      break;
    case "set-state": {
      const { id, state } = step.payload;
      next.nodes = patchNode(next.nodes, id, { state });
      next.highlightId = id;
      break;
    }
    case "update-props": {
      const { id, props } = step.payload;
      next.nodes = patchNode(next.nodes, id, { props });
      next.highlightId = id;
      break;
    }
    case "effect-run":
    case "effect-cleanup":
      next.highlightId = step.payload.id;
      break;
    case "note":
      break;
  }
  return next;
}

export interface ReactExample {
  id: string;
  title: string;
  concept: string;
  description: string;
  code: string;
  trace: ReactStep[];
}

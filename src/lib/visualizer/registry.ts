import type { VisualizerModule } from "./types";
import { javascriptModule } from "./javascript/examples";

// Registry of all visualizer modules. Add future modules here.
export const modules: VisualizerModule[] = [
  javascriptModule as unknown as VisualizerModule,
  // future: reactModule, nextjsModule, dbmsModule, networkModule
];

export const comingSoonModules = [
  { id: "react", name: "React", description: "Render cycle, component tree, re-renders." },
  { id: "nextjs", name: "Next.js", description: "SSR, CSR, SSG, hydration." },
  { id: "dbms", name: "DBMS", description: "Query planning & execution." },
  { id: "network", name: "Network", description: "HTTP & TCP packet flow." },
] as const;

export function getModule(id: string): VisualizerModule | undefined {
  return modules.find((m) => m.id === id);
}

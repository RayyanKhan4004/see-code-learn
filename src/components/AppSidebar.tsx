import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Boxes, Code2, Database, Globe, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const activeModules = [
  { title: "JavaScript", url: "/js", icon: Code2 },
];

const upcomingModules = [
  { title: "React", url: "/react", icon: Layers },
  { title: "Next.js", url: "/nextjs", icon: Boxes },
  { title: "DBMS", url: "/dbms", icon: Database },
  { title: "Network", url: "/network", icon: Globe },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--microtask)] text-primary-foreground">
            <Code2 className="h-4 w-4" />
          </div>
          <span className="font-mono text-sm font-semibold tracking-tight">CodeVision</span>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Visualizers</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activeModules.map((m) => (
                <SidebarMenuItem key={m.url}>
                  <SidebarMenuButton asChild isActive={currentPath === m.url}>
                    <Link to={m.url} className="flex items-center gap-2">
                      <m.icon className="h-4 w-4" />
                      <span>{m.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Coming soon</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {upcomingModules.map((m) => (
                <SidebarMenuItem key={m.url}>
                  <SidebarMenuButton disabled className="opacity-60">
                    <m.icon className="h-4 w-4" />
                    <span>{m.title}</span>
                    <Badge variant="secondary" className="ml-auto text-[9px] uppercase">soon</Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

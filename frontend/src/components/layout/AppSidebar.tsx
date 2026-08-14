import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  LayoutDashboard,
  ListChecks,
  Package,
  PlusCircle,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { listReviews } from "@/services/reviewService";

const workItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Add Product", url: "/products/new", icon: PlusCircle },
  { title: "Review Queue", url: "/reviews", icon: ListChecks },
  { title: "Catalog", url: "/catalog", icon: Boxes },
  { title: "UniHack Enrichment", url: "/unilog", icon: Sparkles },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const [openReviews, setOpenReviews] = useState(0);

  useEffect(() => {
    let active = true;
    listReviews()
      .then((items) => {
        if (active) setOpenReviews(items.filter((r) => !r.resolved).length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);

  const isActive = (url: string) =>
    url === "/products" ? pathname === "/products" : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-1 py-1.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight">
                SpecTrace
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                Product Intelligence
              </span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && item.title === "Review Queue" && openReviews > 0 && (
                        <span className="tabular ml-auto rounded-full bg-inference-surface px-1.5 py-0.5 text-[10px] font-semibold text-inference-foreground">
                          {openReviews}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip="Settings">
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="size-4" />
                    {!collapsed && <span>Settings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold">
            AM
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Anita Mehra</p>
              <p className="truncate text-[11px] text-muted-foreground">
                HydroMax · Product Data
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

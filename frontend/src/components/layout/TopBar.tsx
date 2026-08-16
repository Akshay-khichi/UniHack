import { Fragment, useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronRight, Moon, Search, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { fetchReviewActivity } from "@/services/reviewService";
import type { ReviewActivity } from "@/types/spectrace";
import { toast } from "sonner";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  new: "Add Product",
  reviews: "Review Queue",
  catalog: "Catalog",
  settings: "Settings",
  evidence: "Evidence",
  processing: "Processing",
  unilog: "UniHack Enrichment",
};

export function TopBar() {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const [activity, setActivity] = useState<ReviewActivity[]>([]);
  const { isDark, toggleTheme } = useTheme();
  const segments = pathname.split("/").filter(Boolean);

  useEffect(() => {
    let active = true;
    fetchReviewActivity()
      .then((data) => {
        if (active) setActivity(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-5" />

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-sm md:flex">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
          SpecTrace
        </Link>
        {segments.map((segment, index) => (
          <Fragment key={`${segment}-${index}`}>
            <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
            <span
              className={
                index === segments.length - 1
                  ? "truncate font-medium text-foreground"
                  : "truncate text-muted-foreground"
              }
            >
              {labels[segment] || segment}
            </span>
          </Fragment>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Search products…"
            aria-label="Search products"
            className="h-9 w-48 pl-8 lg:w-64"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                toast("Global search is a prototype action", {
                  description: "Use the catalog filters for now.",
                });
              }
            }}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="size-4 text-foreground" /> : <Moon className="size-4 text-foreground" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-conflict" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Recent activity</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {activity.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground">No recent notifications.</div>
            ) : (
              activity.slice(0, 4).map((item) => (
                <DropdownMenuItem key={item.id} className="flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.detail}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="User menu">
              <span className="grid size-6 place-items-center rounded-md bg-secondary text-[11px] font-semibold">
                A
              </span>
              <span className="hidden text-sm font-medium lg:inline">Akshay</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">Akshay</p>
              <p className="text-xs font-normal text-muted-foreground">
                akshay@gmail.com
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Workspace settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toast("Prototype action", { description: "Authentication is not wired up yet." })
              }
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "neutral" | "fact" | "inference" | "conflict";
}) {
  const iconTone = {
    neutral: "bg-accent text-accent-foreground",
    fact: "bg-fact-surface text-fact-foreground",
    inference: "bg-inference-surface text-inference-foreground",
    conflict: "bg-conflict-surface text-conflict-foreground",
  }[tone];

  return (
    <Card className="gap-0 p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]">
      <div className="flex items-start justify-between gap-3">
        <span className="section-label">{label}</span>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-md", iconTone)}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="tabular mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

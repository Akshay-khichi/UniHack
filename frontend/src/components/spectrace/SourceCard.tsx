import { FileSpreadsheet, FileText, Globe, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToneBadge } from "@/components/spectrace/StatusBadge";
import type { ProductSource, SourceType } from "@/types/spectrace";

export const sourceIcon: Record<SourceType, typeof FileText> = {
  PDF: FileText,
  CSV: FileSpreadsheet,
  IMAGE: ImageIcon,
  URL: Globe,
};

export function SourceCard({
  source,
  className,
  action,
}: {
  source: ProductSource;
  className?: string;
  action?: React.ReactNode;
}) {
  const Icon = sourceIcon[source.type];
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5",
        className,
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{source.name}</p>
        <p className="text-xs text-muted-foreground">
          {source.size ? `${source.size} · ` : ""}
          {source.type}
        </p>
      </div>
      <ToneBadge tone={source.status === "Ready" ? "fact" : "neutral"}>{source.status}</ToneBadge>
      {action}
    </div>
  );
}

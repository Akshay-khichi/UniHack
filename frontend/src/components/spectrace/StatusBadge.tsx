import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, CircleDashed, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttributeStatus, ProductStatus } from "@/types/spectrace";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
  {
    variants: {
      tone: {
        fact: "border-fact/25 bg-fact-surface text-fact-foreground",
        inference: "border-inference/30 bg-inference-surface text-inference-foreground",
        unverified: "border-unverified/25 bg-unverified-surface text-unverified-foreground",
        conflict: "border-conflict/30 bg-conflict-surface text-conflict-foreground",
        neutral: "border-border bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badge>["tone"]>;

const attributeConfig: Record<
  AttributeStatus,
  { tone: BadgeTone; label: string; Icon: typeof CheckCircle2 }
> = {
  FACT: { tone: "fact", label: "Fact", Icon: CheckCircle2 },
  VALIDATED: { tone: "fact", label: "Validated", Icon: ShieldCheck },
  AI_INFERENCE: { tone: "inference", label: "AI Inference", Icon: Sparkles },
  UNVERIFIED: { tone: "unverified", label: "Unverified", Icon: CircleDashed },
  CONFLICT: { tone: "conflict", label: "Conflict", Icon: AlertTriangle },
};

export function StatusBadge({
  status,
  className,
}: {
  status: AttributeStatus;
  className?: string;
}) {
  const { tone, label, Icon } = attributeConfig[status];
  return (
    <span className={cn(badge({ tone }), className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

const productConfig: Record<ProductStatus, { tone: BadgeTone; label: string }> = {
  READY: { tone: "fact", label: "Ready" },
  REVIEW_REQUIRED: { tone: "inference", label: "Needs Review" },
  CONFLICT: { tone: "conflict", label: "Conflict" },
  PROCESSING: { tone: "neutral", label: "Processing" },
  DRAFT: { tone: "neutral", label: "Draft" },
};

export function ProductStatusBadge({
  status,
  className,
}: {
  status: ProductStatus;
  className?: string;
}) {
  const { tone, label } = productConfig[status];
  return <span className={cn(badge({ tone }), className)}>{label}</span>;
}

export function ToneBadge({
  tone,
  children,
  className,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn(badge({ tone }), className)}>{children}</span>;
}

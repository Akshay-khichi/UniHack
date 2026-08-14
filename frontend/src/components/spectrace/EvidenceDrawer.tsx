import { CalendarClock, FileText, Info, ShieldAlert } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfidenceBadge } from "@/components/spectrace/Metrics";
import { StatusBadge, ToneBadge } from "@/components/spectrace/StatusBadge";
import { sourceIcon } from "@/components/spectrace/SourceCard";
import type { Evidence, ProductAttribute } from "@/types/spectrace";

function trustLabel(attribute: ProductAttribute) {
  switch (attribute.status) {
    case "FACT":
    case "VALIDATED":
      return { tone: "fact" as const, text: "Evidence-backed" };
    case "AI_INFERENCE":
      return { tone: "inference" as const, text: "Derived from available evidence" };
    case "CONFLICT":
      return { tone: "conflict" as const, text: "Contradiction detected" };
    default:
      return { tone: "unverified" as const, text: "No reliable supporting evidence found" };
  }
}

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const Icon = sourceIcon[evidence.sourceType];
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <span className="truncate text-sm font-medium">{evidence.sourceName}</span>
        {evidence.page !== undefined && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            Page {evidence.page}
          </span>
        )}
      </div>
      <div className="space-y-2 px-3 py-3">
        {evidence.value && (
          <p className="text-xs font-semibold text-muted-foreground">
            Extracted value: <span className="text-foreground">{evidence.value}</span>
          </p>
        )}
        <blockquote className="border-l-2 border-primary/40 bg-surface px-3 py-2 font-mono text-xs leading-relaxed">
          “{evidence.excerpt}”
        </blockquote>
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarClock className="size-3" aria-hidden />
          Extracted {new Date(evidence.extractedAt).toLocaleString()} · {evidence.sourceType}
        </p>
      </div>
    </div>
  );
}

export function EvidenceDrawer({
  attribute,
  productName,
  open,
  onOpenChange,
  onResolve,
  onReview,
}: {
  attribute: ProductAttribute | null;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve?: (value: string) => void;
  onReview?: () => void;
}) {
  const trust = attribute ? trustLabel(attribute) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {attribute && trust && (
          <>
            <SheetHeader className="gap-2 border-b border-border">
              <p className="section-label">Attribute · {productName}</p>
              <SheetTitle className="text-lg">{attribute.name}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={attribute.status} />
                <ConfidenceBadge confidence={attribute.confidence} />
              </div>
            </SheetHeader>

            <div className="space-y-5 px-4 py-5">
              <div className="rounded-md border border-border bg-surface px-3 py-3">
                <p className="section-label">Current value</p>
                <p className="mt-1 text-base font-semibold">{attribute.value}</p>
                <div className="mt-2">
                  <ToneBadge tone={trust.tone}>{trust.text}</ToneBadge>
                </div>
              </div>

              {attribute.status === "CONFLICT" && attribute.evidence.length > 1 && (
                <div className="rounded-md border border-conflict/30 bg-conflict-surface p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-conflict-foreground">
                    <ShieldAlert className="size-4" aria-hidden />
                    Contradiction detected
                  </p>
                  <p className="mt-1 text-xs text-conflict-foreground/85">
                    Multiple sources provide different values for the same attribute. SpecTrace
                    will not select a value automatically.
                  </p>
                  <div className="mt-3 grid gap-2">
                    {attribute.evidence.map((evidence, index) => (
                      <div
                        key={`${evidence.sourceId}-${index}`}
                        className="rounded-md border border-border bg-card px-3 py-2"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Source {String.fromCharCode(65 + index)}
                        </p>
                        <p className="text-sm font-semibold">{evidence.value ?? attribute.value}</p>
                        <p className="text-xs text-muted-foreground">
                          {evidence.sourceName}
                          {evidence.page !== undefined ? ` · Page ${evidence.page}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                  {onResolve && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attribute.evidence.map((evidence, index) => (
                        <Button
                          key={`accept-${index}`}
                          size="sm"
                          variant="outline"
                          onClick={() => onResolve(evidence.value ?? attribute.value)}
                        >
                          Accept {evidence.value ?? attribute.value}
                        </Button>
                      ))}
                      {onReview && (
                        <Button size="sm" onClick={onReview}>
                          Review evidence
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {attribute.reasoning && (
                <div className="rounded-md border border-border bg-card p-3">
                  <p className="flex items-center gap-2 section-label">
                    <Info className="size-3.5" aria-hidden />
                    Reasoning
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {attribute.reasoning}
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <p className="section-label">Evidence</p>
                {attribute.evidence.length > 0 ? (
                  attribute.evidence.map((evidence, index) => (
                    <EvidenceCard key={`${evidence.sourceId}-${index}`} evidence={evidence} />
                  ))
                ) : (
                  <div className="rounded-md border border-dashed border-border bg-surface px-3 py-6 text-center">
                    <FileText className="mx-auto size-5 text-muted-foreground" aria-hidden />
                    <p className="mt-2 text-sm font-medium">No reliable supporting evidence</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      No ingested document, page or image supports this value. Human review is
                      required before this attribute can be published.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

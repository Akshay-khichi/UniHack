import { useEffect, useState } from "react";
import { GitCompareArrows, History } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ConfidenceBadge } from "@/components/spectrace/Metrics";
import { StatusBadge, ToneBadge } from "@/components/spectrace/StatusBadge";
import { getProduct } from "@/services/productService";
import type { ReviewDecision } from "@/services/reviewService";
import type { Product, ProductAttribute, ReviewItem } from "@/types/spectrace";

export function ReviewPanel({
  review,
  open,
  onOpenChange,
  onSubmit,
}: {
  review: ReviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (decision: ReviewDecision, value: string, note: string) => void;
}) {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [product, setProduct] = useState<Product | undefined>(undefined);

  useEffect(() => {
    setValue(review?.currentValue ?? "");
    setNote("");
    setProduct(undefined);

    if (review?.productId) {
      let active = true;
      getProduct(review.productId)
        .then((p) => {
          if (active) setProduct(p);
        })
        .catch((err) => console.warn(err));
      return () => {
        active = false;
      };
    }
    return undefined;
  }, [review]);

  const attribute: ProductAttribute | undefined = product?.attributes.find(
    (a) => a.name.toLowerCase() === review?.attributeName.toLowerCase() || a.id === review?.attributeId,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {review && (
          <>
            <SheetHeader className="gap-2 border-b border-border">
              <p className="section-label">
                Human review · {review.productSku}
              </p>
              <SheetTitle className="text-lg">{review.attributeName}</SheetTitle>
              <p className="text-sm text-muted-foreground">{review.productName}</p>
              <div className="flex flex-wrap items-center gap-2">
                {attribute && <StatusBadge status={attribute.status} />}
                <ConfidenceBadge confidence={review.confidence} />
                <ToneBadge tone={review.priority === "High" ? "conflict" : "neutral"}>
                  {review.priority} priority
                </ToneBadge>
              </div>
            </SheetHeader>

            <div className="space-y-5 px-4 py-5">
              <div className="rounded-md border border-border bg-surface px-3 py-3">
                <p className="section-label">Reason flagged</p>
                <p className="mt-1 text-sm">{review.reason}</p>
              </div>

              {attribute && attribute.evidence.length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 section-label">
                    <GitCompareArrows className="size-3.5" aria-hidden />
                    {attribute.evidence.length > 1 ? "Conflicting sources" : "Evidence"}
                  </p>
                  {attribute.evidence.map((evidence, index) => (
                    <button
                      key={`${evidence.sourceId}-${index}`}
                      type="button"
                      onClick={() => setValue(evidence.value ?? attribute.value)}
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                    >
                      <p className="text-sm font-semibold">
                        {evidence.value ?? attribute.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {evidence.sourceName}
                        {evidence.page !== undefined ? ` · Page ${evidence.page}` : ""}
                      </p>
                      <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
                        “{evidence.excerpt}”
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {attribute && attribute.evidence.length === 0 && (
                <div className="rounded-md border border-dashed border-border bg-surface px-3 py-4 text-sm text-muted-foreground">
                  No reliable supporting evidence found for this attribute.
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="review-value">Value</Label>
                <Input
                  id="review-value"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-note">Reviewer note (optional)</Label>
                <Textarea
                  id="review-note"
                  rows={3}
                  placeholder="Manufacturer datasheet takes precedence over marketing catalog."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>

              <p className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
                <History className="size-3.5 shrink-0" aria-hidden />
                Changes will create a new product version.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onSubmit("approve", value, note)}>Approve</Button>
                <Button variant="outline" onClick={() => onSubmit("edit", value, note)}>
                  Save edit
                </Button>
                <Button variant="outline" onClick={() => onSubmit("unverified", value, note)}>
                  Mark unverified
                </Button>
                <Button variant="ghost" onClick={() => onSubmit("reject", value, note)}>
                  Reject
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

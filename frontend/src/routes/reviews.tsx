import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/spectrace/States";
import { ConfidenceBadge } from "@/components/spectrace/Metrics";
import { ToneBadge } from "@/components/spectrace/StatusBadge";
import { ReviewPanel } from "@/components/spectrace/ReviewPanel";
import { listReviews, resolveReviewApi, type ReviewDecision } from "@/services/reviewService";
import type { ReviewItem } from "@/types/spectrace";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Human Review — SpecTrace" },
      {
        name: "description",
        content:
          "Resolve uncertain, conflicting or low-confidence product information before it reaches commerce channels.",
      },
      { property: "og:title", content: "Human Review — SpecTrace" },
      {
        property: "og:description",
        content: "Review queue for conflicts, unverified claims and low-confidence attributes.",
      },
    ],
  }),
  component: ReviewsPage,
});

const tabs = [
  { id: "all", label: "All" },
  { id: "LOW_CONFIDENCE", label: "Low Confidence" },
  { id: "CONFLICT", label: "Conflicts" },
  { id: "UNVERIFIED", label: "Unverified" },
  { id: "VALIDATION_ERROR", label: "Validation Errors" },
];

function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [active, setActive] = useState<ReviewItem | null>(null);
  const [open, setOpen] = useState(false);

  const fetchQueue = async () => {
    try {
      const data = await listReviews();
      setReviews(data);
    } catch (err) {
      console.error("Failed to load review queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const filtered = reviews.filter((r) => (tab === "all" ? true : r.type === tab));

  const submit = async (decision: ReviewDecision, value: string, note: string) => {
    if (!active) return;
    try {
      await resolveReviewApi({ reviewId: active.id, decision, value, note });
      setOpen(false);
      toast.success(`${active.attributeName} resolved`, {
        description: "A new product version was recorded in backend.",
      });
      await fetchQueue();
    } catch (err: unknown) {
      toast.error("Review action failed", {
        description: err instanceof Error ? err.message : "API error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human Review"
        subtitle="Resolve uncertain, conflicting, or low-confidence product information."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading review queue...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Nothing to review here"
                description="This queue is empty. All attributes are verified or no pending reviews exist."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Product</TableHead>
                    <TableHead>Attribute</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-mono text-xs">{review.productSku}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {review.attributeName}
                      </TableCell>
                      <TableCell className="text-sm">{review.currentValue}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {review.reason}
                      </TableCell>
                      <TableCell>
                        <ConfidenceBadge confidence={review.confidence} />
                      </TableCell>
                      <TableCell>
                        <ToneBadge
                          tone={
                            review.priority === "High"
                              ? "conflict"
                              : review.priority === "Medium"
                                ? "inference"
                                : "neutral"
                          }
                        >
                          {review.priority}
                        </ToneBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        {review.resolved ? (
                          <ToneBadge tone="fact">Resolved</ToneBadge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setActive(review);
                              setOpen(true);
                            }}
                          >
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewPanel review={active} open={open} onOpenChange={setOpen} onSubmit={submit} />
    </div>
  );
}

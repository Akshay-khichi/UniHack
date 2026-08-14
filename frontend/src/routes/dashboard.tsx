import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/spectrace/KpiCard";
import { MetricBar } from "@/components/spectrace/Metrics";
import { PageHeader } from "@/components/spectrace/States";
import { ProductTable } from "@/components/spectrace/ProductTable";
import { fetchDashboardMetrics, listProducts } from "@/services/productService";
import { fetchReviewActivity } from "@/services/reviewService";
import type { Product, ReviewActivity } from "@/types/spectrace";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SpecTrace Product Intelligence" },
      {
        name: "description",
        content:
          "Monitor processed products, verified attributes, conflicts and data quality across your industrial catalog.",
      },
      { property: "og:title", content: "Dashboard — SpecTrace Product Intelligence" },
      {
        property: "og:description",
        content: "Product data quality, review activity and recent product intelligence runs.",
      },
    ],
  }),
  component: DashboardPage,
});

const activityTone = {
  approved: "bg-fact-surface text-fact-foreground",
  unverified: "bg-unverified-surface text-unverified-foreground",
  conflict: "bg-conflict-surface text-conflict-foreground",
  updated: "bg-accent text-accent-foreground",
} as const;

function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activity, setActivity] = useState<ReviewActivity[]>([]);
  const [metrics, setMetrics] = useState({
    productsProcessed: 0,
    verifiedAttributes: 0,
    needsReview: 0,
    conflictsDetected: 0,
    averageQuality: 0,
    quality: {
      completeness: 0,
      sourceCoverage: 0,
      validationSuccess: 0,
      verifiedAttributes: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [productList, metricData, activityData] = await Promise.all([
          listProducts().catch(() => []),
          fetchDashboardMetrics(),
          fetchReviewActivity().catch(() => []),
        ]);
        if (active) {
          setProducts(productList);
          setMetrics(metricData);
          setActivity(activityData);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Intelligence"
        subtitle="Transform fragmented product information into trusted, commerce-ready data."
        actions={
          <>
            <Button asChild>
              <Link to="/products/new">
                <Plus className="size-4" /> Add Product
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/catalog">View Catalog</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Products Processed"
          value={loading ? "..." : metrics.productsProcessed.toLocaleString()}
          hint="Total in catalog"
          icon={Boxes}
        />
        <KpiCard
          label="Verified Attributes"
          value={loading ? "..." : metrics.verifiedAttributes.toLocaleString()}
          hint="Extracted attributes"
          icon={BadgeCheck}
          tone="fact"
        />
        <KpiCard
          label="Needs Review"
          value={loading ? "..." : metrics.needsReview.toLocaleString()}
          hint="Queued for human review"
          icon={ClipboardList}
          tone="inference"
        />
        <KpiCard
          label="Conflicts Detected"
          value={loading ? "..." : metrics.conflictsDetected.toLocaleString()}
          hint="Cross-source contradictions"
          icon={AlertTriangle}
          tone="conflict"
        />
        <KpiCard
          label="Average Data Quality"
          value={loading ? "..." : `${metrics.averageQuality}%`}
          hint="Catalog average"
          icon={Gauge}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Product Data Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricBar label="Completeness" value={metrics.quality.completeness} />
            <MetricBar
              label="Source Coverage"
              value={metrics.quality.sourceCoverage}
              toneClass="bg-fact"
            />
            <MetricBar
              label="Validation Success"
              value={metrics.quality.validationSuccess}
              toneClass="bg-primary"
            />
            <MetricBar
              label="Verified Attributes"
              value={metrics.quality.verifiedAttributes}
              toneClass="bg-fact"
            />
            <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
              Extract → Enrich → Verify → Validate → Review → Trusted data
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Products</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/products">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading products...</div>
            ) : (
              <ProductTable products={products.slice(0, 5)} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activity.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1 py-2">No recent review activity recorded yet.</p>
          ) : (
            activity.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5"
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-md ${activityTone[item.kind]}`}
                >
                  <CheckCircle2 className="size-3.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{item.at}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

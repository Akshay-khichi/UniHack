import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Download, FileJson, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/spectrace/States";
import { AttributeTable } from "@/components/spectrace/AttributeTable";
import { EvidenceDrawer } from "@/components/spectrace/EvidenceDrawer";
import { MetricBar, QualityScore, ConfidenceBadge } from "@/components/spectrace/Metrics";
import { ProductStatusBadge } from "@/components/spectrace/StatusBadge";
import { exportProductFile, getProduct } from "@/services/productService";
import type { Product, ProductAttribute } from "@/types/spectrace";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      { title: "Product Intelligence — SpecTrace" },
      {
        name: "description",
        content:
          "Evidence-backed product attributes with confidence scoring, contradiction detection and review status.",
      },
      { property: "og:title", content: "Product Intelligence — SpecTrace" },
      {
        property: "og:description",
        content: "See exactly where each product attribute came from and whether it can be trusted.",
      },
    ],
  }),
  component: ProductIntelligencePage,
});

function ProductIntelligencePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductAttribute | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getProduct(id)
      .then((data) => {
        if (active) {
          if (data) {
            setProduct(data);
          } else {
            setError("Product not found in catalog");
          }
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load product");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading product intelligence...
      </div>
    );
  }

  if (error || !product) {
    return (
      <EmptyState
        title="Product not found"
        description={error || "This product is not in the catalog."}
        action={
          <Button asChild variant="outline">
            <Link to="/products">Back to products</Link>
          </Button>
        }
      />
    );
  }

  const current = selected
    ? (product.attributes.find((a) => a.id === selected.id) ?? selected)
    : null;

  const download = async (format: "json" | "csv") => {
    try {
      await exportProductFile(product.id, format, product.sku);
      toast.success(`Exported ${product.sku}.${format}`);
    } catch (err: unknown) {
      toast.error(`Export failed`, { description: err instanceof Error ? err.message : "Download error" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        subtitle={`SKU: ${product.sku} · Brand: ${product.brand} · Category: ${product.category}`}
        actions={
          <>
            <Button onClick={() => navigate({ to: "/reviews" })}>
              <ShieldCheck className="size-4" /> Review Product
            </Button>
            <Button variant="outline" onClick={() => download("json")}>
              <FileJson className="size-4" /> Export JSON
            </Button>
            <Button variant="outline" onClick={() => download("csv")}>
              <FileSpreadsheet className="size-4" /> Export CSV
            </Button>
            <Button asChild variant="outline">
              <Link to="/products/$id/evidence" params={{ id: product.id }}>
                <Download className="size-4" /> View Evidence
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="flex items-center gap-4 pt-6">
            <QualityScore score={product.qualityScore} size="lg" />
            <div>
              <p className="section-label">Overall quality</p>
              <p className="tabular text-sm font-semibold">{product.qualityScore}/100</p>
              <p className="mt-2 section-label">Overall confidence</p>
              <ConfidenceBadge confidence={product.confidence} showBar={false} />
              <div className="mt-2">
                <ProductStatusBadge status={product.status} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Product summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <p className="text-sm leading-relaxed text-muted-foreground md:col-span-2">
              {product.description}
            </p>
            <div>
              <p className="section-label">Applications</p>
              <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                {product.applications.length === 0 ? (
                  <li className="text-xs italic">Extracted from technical specifications.</li>
                ) : (
                  product.applications.map((item) => <li key={item}>· {item}</li>)
                )}
              </ul>
            </div>
            <div>
              <p className="section-label">Key features</p>
              <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                {product.features.length === 0 ? (
                  <li className="text-xs italic">Attributes verified against source document.</li>
                ) : (
                  product.features.map((item) => <li key={item}>· {item}</li>)
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attributes</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <AttributeTable
            attributes={product.attributes}
            selectedId={current?.id}
            onSelect={(attribute) => {
              setSelected(attribute);
              setOpen(true);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quality breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <MetricBar label="Completeness" value={product.quality.completeness} />
          <MetricBar
            label="Source Coverage"
            value={product.quality.sourceCoverage}
            toneClass="bg-fact"
          />
          <MetricBar label="Validation" value={product.quality.validation} />
          <MetricBar
            label="Confidence"
            value={product.quality.confidence}
            toneClass="bg-inference"
          />
          <div className="rounded-md border border-border bg-surface px-3 py-2 md:col-span-2">
            <span className="text-sm text-muted-foreground">Contradictions</span>
            <span className="tabular ml-2 text-sm font-semibold">
              {product.quality.contradictions}
            </span>
          </div>
        </CardContent>
      </Card>

      <EvidenceDrawer
        attribute={current}
        productName={product.sku}
        open={open}
        onOpenChange={setOpen}
        onResolve={() => {
          navigate({ to: "/reviews" });
        }}
        onReview={() => navigate({ to: "/reviews" })}
      />
    </div>
  );
}

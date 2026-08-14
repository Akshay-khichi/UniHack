import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/spectrace/States";
import { SourceCard } from "@/components/spectrace/SourceCard";
import { StatusBadge, ToneBadge } from "@/components/spectrace/StatusBadge";
import { ConfidenceBadge } from "@/components/spectrace/Metrics";
import { getProduct } from "@/services/productService";
import type { Product } from "@/types/spectrace";

export const Route = createFileRoute("/products_/$id/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence — SpecTrace" },
      {
        name: "description",
        content:
          "Document-level evidence for every extracted product attribute: source, page, excerpt and extraction time.",
      },
      { property: "og:title", content: "Evidence — SpecTrace" },
      {
        property: "og:description",
        content: "Trace every product attribute back to the document it came from.",
      },
    ],
  }),
  component: EvidencePage,
});

function EvidencePage() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProduct(id)
      .then((data) => {
        if (active) setProduct(data || null);
      })
      .catch((err) => console.error(err))
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
        Loading evidence data...
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState title="Product not found" description="This product is not in the catalog." />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Evidence · ${product.sku}`}
        subtitle="Every attribute traced back to the document, page and excerpt it was extracted from."
        actions={
          <Button asChild variant="outline">
            <Link to="/products/$id" params={{ id: product.id }}>
              <ArrowLeft className="size-4" /> Back to product
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingested sources</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {product.sources.length === 0 ? (
            <p className="text-xs text-muted-foreground">No documents ingested for this product.</p>
          ) : (
            product.sources.map((source) => <SourceCard key={source.id} source={source} />)
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {product.attributes.map((attribute) => (
          <Card key={attribute.id}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold">{attribute.name}</p>
                <span className="text-sm text-muted-foreground">{attribute.value}</span>
                <StatusBadge status={attribute.status} />
                <ConfidenceBadge confidence={attribute.confidence} />
              </div>
              {attribute.evidence.length === 0 ? (
                <ToneBadge tone="unverified">No reliable supporting evidence found</ToneBadge>
              ) : (
                <div className="grid gap-2">
                  {attribute.evidence.map((evidence, index) => (
                    <div
                      key={`${evidence.sourceId}-${index}`}
                      className="rounded-md border border-border bg-surface px-3 py-2"
                    >
                      <p className="text-xs font-medium">
                        {evidence.sourceName}
                        {evidence.page !== undefined ? ` · Page ${evidence.page}` : ""} ·{" "}
                        {evidence.sourceType}
                      </p>
                      <p className="mt-1 font-mono text-xs leading-relaxed text-muted-foreground">
                        “{evidence.excerpt}”
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Extracted {new Date(evidence.extractedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

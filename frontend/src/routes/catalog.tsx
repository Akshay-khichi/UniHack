import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/spectrace/States";
import { ProductTable } from "@/components/spectrace/ProductTable";
import { FilterBar } from "@/components/spectrace/FilterBar";
import { listProducts } from "@/services/productService";
import type { Product } from "@/types/spectrace";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Catalog — SpecTrace" },
      {
        name: "description",
        content:
          "Filter and search commerce-ready industrial products by category, status, quality score and confidence.",
      },
      { property: "og:title", content: "Catalog — SpecTrace" },
      {
        property: "og:description",
        content: "Batch view of processed products with quality and confidence signals.",
      },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [quality, setQuality] = useState("all");
  const [confidence, setConfidence] = useState("all");

  useEffect(() => {
    let active = true;
    listProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const filtered = products.filter((p) => {
    const term = search.toLowerCase();
    if (term && !`${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(term)) return false;
    if (category !== "all" && p.category !== category) return false;
    if (status !== "all" && p.status !== status) return false;
    if (quality !== "all" && p.qualityScore < Number(quality)) return false;
    if (confidence !== "all" && p.confidence < Number(confidence)) return false;
    return true;
  });

  const ready = products.filter((p) => p.status === "READY").length;
  const review = products.filter((p) => p.status === "REVIEW_REQUIRED").length;
  const conflict = products.filter((p) => p.status === "CONFLICT").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog"
        subtitle="Commerce-ready product data, filtered by trust signals."
        actions={
          <Button asChild>
            <Link to="/products/new">
              <Plus className="size-4" /> Add Product
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Products", value: products.length, tone: "bg-secondary" },
          { label: "Ready", value: ready, tone: "bg-fact-surface" },
          { label: "Needs Review", value: review, tone: "bg-inference-surface" },
          { label: "Conflict", value: conflict, tone: "bg-conflict-surface" },
        ].map((item) => (
          <Card key={item.label} className={`gap-0 p-4 ${item.tone}`}>
            <p className="tabular text-2xl font-semibold">{item.value}</p>
            <p className="text-xs font-medium">{item.label}</p>
          </Card>
        ))}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        filters={[
          {
            id: "category",
            label: "Category",
            value: category,
            onChange: setCategory,
            options: [
              { label: "All categories", value: "all" },
              ...categories.map((c) => ({ label: c, value: c })),
            ],
          },
          {
            id: "status",
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "All statuses", value: "all" },
              { label: "Ready", value: "READY" },
              { label: "Needs Review", value: "REVIEW_REQUIRED" },
              { label: "Conflict", value: "CONFLICT" },
            ],
          },
          {
            id: "quality",
            label: "Quality",
            value: quality,
            onChange: setQuality,
            options: [
              { label: "Any quality", value: "all" },
              { label: "Quality ≥ 90", value: "90" },
              { label: "Quality ≥ 80", value: "80" },
              { label: "Quality ≥ 70", value: "70" },
            ],
          },
          {
            id: "confidence",
            label: "Confidence",
            value: confidence,
            onChange: setConfidence,
            options: [
              { label: "Any confidence", value: "all" },
              { label: "Confidence ≥ 90", value: "90" },
              { label: "Confidence ≥ 80", value: "80" },
              { label: "Confidence ≥ 70", value: "70" },
            ],
          },
        ]}
      />

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading catalog...</div>
          ) : (
            <ProductTable products={filtered} showConfidence />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

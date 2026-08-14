import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/spectrace/States";
import { ProductTable } from "@/components/spectrace/ProductTable";
import { listProducts } from "@/services/productService";
import type { Product } from "@/types/spectrace";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Products — SpecTrace" },
      {
        name: "description",
        content:
          "All products processed by SpecTrace with quality score, confidence and review status.",
      },
      { property: "og:title", content: "Products — SpecTrace" },
      {
        property: "og:description",
        content: "Browse processed industrial products and their trust signals.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Every product processed into structured, evidence-backed intelligence."
        actions={
          <Button asChild>
            <Link to="/products/new">
              <Plus className="size-4" /> Add Product
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading products...</div>
          ) : (
            <ProductTable products={products} showConfidence />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

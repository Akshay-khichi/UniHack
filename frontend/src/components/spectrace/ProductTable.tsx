import { Link } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfidenceBadge, QualityScore } from "@/components/spectrace/Metrics";
import { ProductStatusBadge } from "@/components/spectrace/StatusBadge";
import { EmptyState } from "@/components/spectrace/States";
import type { Product } from "@/types/spectrace";

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function ProductTable({
  products,
  showConfidence = false,
}: {
  products: Product[];
  showConfidence?: boolean;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products match these filters"
        description="Adjust the filters or search term to see more of the catalog."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Attributes</TableHead>
            <TableHead>Quality</TableHead>
            {showConfidence && <TableHead>Confidence</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const verified = product.attributes.filter(
              (a) => a.status === "FACT" || a.status === "VALIDATED",
            ).length;
            return (
              <TableRow key={product.id} className="group">
                <TableCell className="max-w-[280px]">
                  <Link
                    to="/products/$id"
                    params={{ id: product.id }}
                    className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{product.brand}</p>
                </TableCell>
                <TableCell className="tabular font-mono text-xs">{product.sku}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {product.category}
                </TableCell>
                <TableCell className="tabular text-sm">
                  {verified}/{product.attributesTotal}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <QualityScore score={product.qualityScore} size="sm" />
                  </div>
                </TableCell>
                {showConfidence && (
                  <TableCell>
                    <ConfidenceBadge confidence={product.confidence} showBar={false} />
                  </TableCell>
                )}
                <TableCell>
                  <ProductStatusBadge status={product.status} />
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {relative(product.updatedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

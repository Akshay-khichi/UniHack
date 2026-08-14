import { ChevronRight, FileSearch } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/spectrace/Metrics";
import { StatusBadge, ToneBadge } from "@/components/spectrace/StatusBadge";
import type { ProductAttribute } from "@/types/spectrace";

function evidenceLabel(attribute: ProductAttribute) {
  if (attribute.evidence.length > 1) return `${attribute.evidence.length} sources`;
  if (attribute.evidence.length === 1)
    return attribute.status === "AI_INFERENCE" ? "View reasoning" : "View source";
  return "No reliable source";
}

export function AttributeTable({
  attributes,
  onSelect,
  selectedId,
}: {
  attributes: ProductAttribute[];
  onSelect: (attribute: ProductAttribute) => void;
  selectedId?: string | undefined;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Attribute</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Evidence</TableHead>
            <TableHead className="text-right">Review</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attributes.map((attribute) => (
            <TableRow
              key={attribute.id}
              tabIndex={0}
              role="button"
              aria-label={`Open evidence for ${attribute.name}`}
              data-state={selectedId === attribute.id ? "selected" : undefined}
              onClick={() => onSelect(attribute)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(attribute);
                }
              }}
              className="cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <TableCell>
                <p className="text-sm font-medium">{attribute.name}</p>
                <p className="text-xs text-muted-foreground">{attribute.group}</p>
              </TableCell>
              <TableCell className="text-sm">{attribute.value}</TableCell>
              <TableCell>
                <StatusBadge status={attribute.status} />
              </TableCell>
              <TableCell>
                <ConfidenceBadge confidence={attribute.confidence} />
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-sm text-primary">
                  <FileSearch className="size-3.5" aria-hidden />
                  {evidenceLabel(attribute)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center gap-2">
                  {attribute.reviewState === "REVIEW_REQUIRED" ? (
                    <ToneBadge tone="inference">Review</ToneBadge>
                  ) : attribute.reviewState === "REJECTED" ? (
                    <ToneBadge tone="conflict">Rejected</ToneBadge>
                  ) : (
                    <ToneBadge tone="fact">
                      {attribute.reviewState === "APPROVED" ? "Approved" : "Verified"}
                    </ToneBadge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    tabIndex={-1}
                    aria-hidden
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

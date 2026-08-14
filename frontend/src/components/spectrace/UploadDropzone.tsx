import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ProductSource, SourceType } from "@/types/spectrace";

function typeFromName(name: string): SourceType {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".csv")) return "CSV";
  return "IMAGE";
}

function formatSize(bytes: number) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function UploadDropzone({ onAdd }: { onAdd: (sources: ProductSource[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const mapped: ProductSource[] = Array.from(files).map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      name: file.name,
      type: typeFromName(file.name),
      size: formatSize(file.size),
      status: "Ready",
      ingestedAt: new Date().toISOString(),
      rawFile: file,
    }));
    onAdd(mapped);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
        dragging ? "border-primary bg-accent" : "border-border bg-surface",
      )}
    >
      <UploadCloud className="mx-auto size-6 text-muted-foreground" aria-hidden />
      <p className="mt-3 text-sm font-medium">Drag and drop documents here</p>
      <p className="mt-1 text-xs text-muted-foreground">
        PDF, CSV or images. Add manufacturer pages, datasheets, catalogs, or product images.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() => inputRef.current?.click()}
      >
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.csv,image/*"
        className="sr-only"
        aria-label="Upload product documents"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

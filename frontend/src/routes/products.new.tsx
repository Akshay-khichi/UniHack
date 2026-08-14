import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/spectrace/States";
import { SourceCard } from "@/components/spectrace/SourceCard";
import { UploadDropzone } from "@/components/spectrace/UploadDropzone";
import {
  ProcessingPipeline,
  type StageState,
} from "@/components/spectrace/ProcessingPipeline";
import {
  PIPELINE_STAGES,
  createProduct,
  processProductApi,
  uploadProductDocument,
} from "@/services/productService";
import type { ProductSource } from "@/types/spectrace";

export const Route = createFileRoute("/products/new")({
  head: () => ({
    meta: [
      { title: "Create Product Intelligence — SpecTrace" },
      {
        name: "description",
        content:
          "Start with limited product information and let SpecTrace extract, enrich, validate and organize product data.",
      },
      { property: "og:title", content: "Create Product Intelligence — SpecTrace" },
      {
        property: "og:description",
        content: "Upload datasheets, catalogs and product pages to build trusted product data.",
      },
    ],
  }),
  component: AddProductPage,
});

function AddProductPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    sku: "HC-5020",
    brand: "HydroMax",
    category: "Hydraulic Cylinders",
    description: "Double-Acting Hydraulic Cylinder for heavy industrial applications.",
  });
  const [url, setUrl] = useState("");
  const [sources, setSources] = useState<ProductSource[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [states, setStates] = useState<StageState[]>(
    PIPELINE_STAGES.map(() => "pending" as StageState),
  );

  const start = async () => {
    if (!form.sku.trim()) {
      toast.error("SKU / Part Number is required");
      return;
    }

    setProcessing(true);
    setProcessingError(null);
    setStates((prev) => prev.map((_, i) => (i === 0 ? "processing" : "pending")));

    try {
      // 1. Create Product in Backend (Fixes P0-1)
      const product = await createProduct(form);

      setStates((prev) => prev.map((s, i) => (i <= 2 ? "complete" : i === 3 ? "processing" : s)));

      // 2. Upload Document Files to Backend
      const rawFiles = sources.map((s) => s.rawFile).filter((f): f is File => Boolean(f));
      for (const file of rawFiles) {
        let sourceType = "TECHNICAL_DATASHEET";
        let docType = "TECHNICAL_DATASHEET";
        const lowerName = file.name.toLowerCase();
        if (lowerName.includes("marketing") || lowerName.includes("brochure")) {
          sourceType = "MARKETING_DOCUMENT";
          docType = "MARKETING";
        } else if (lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
          sourceType = "MARKETING_DOCUMENT";
          docType = "IMAGE";
        } else if (lowerName.endsWith(".csv")) {
          sourceType = "TECHNICAL_DATASHEET";
          docType = "CSV";
        }

        await uploadProductDocument(product.id, file, sourceType, docType).catch((err) => {
          console.warn(`File upload warning for ${file.name}:`, err);
        });
      }

      setStates((prev) => prev.map((s, i) => (i <= 5 ? "complete" : i === 6 ? "processing" : s)));

      // 3. Trigger Real Backend Pipeline Processing
      const result = await processProductApi(product.id);

      setStates(PIPELINE_STAGES.map(() => "complete" as StageState));
      toast.success("Product intelligence ready", {
        description: `Extracted fields: ${result.fieldsExtracted}, Conflicts: ${result.conflicts}`,
      });

      // 4. Navigate to real backend product page
      navigate({ to: "/products/$id", params: { id: product.id } });
    } catch (err: unknown) {
      console.error("Product processing failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to generate product intelligence";
      setProcessingError(msg);
      toast.error("Processing failed", { description: msg });
      setStates((prev) => prev.map((s) => (s === "processing" ? "pending" : s)));
    }
  };

  if (processing) {
    const done = states.filter((s) => s === "complete").length;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Building Product Intelligence"
          subtitle={`${form.sku} · extracting, enriching and validating from ${sources.length} sources.`}
        />
        <Card>
          <CardContent className="pt-6">
            <ProcessingPipeline stages={PIPELINE_STAGES} states={states} />
            <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(done / PIPELINE_STAGES.length) * 100}%` }}
              />
            </div>
            {done === PIPELINE_STAGES.length && !processingError && (
              <p className="mt-4 text-sm font-medium text-fact-foreground">
                Product intelligence ready
              </p>
            )}
            {processingError && (
              <div className="mt-4 rounded-md border border-conflict/30 bg-conflict-surface p-3 text-sm text-conflict-foreground">
                <p className="font-semibold">Processing stopped:</p>
                <p className="mt-1 text-xs">{processingError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setProcessing(false)}
                >
                  Back to form
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Create Product Intelligence"
        subtitle="Start with limited product information. SpecTrace will extract, enrich, validate, and organize the product data."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product input</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={form.name}
              placeholder="Double-Acting Hydraulic Cylinder"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU / Part Number *</Label>
            <Input
              id="sku"
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={form.brand}
              placeholder="HydroMax"
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={form.category}
              placeholder="Hydraulic Cylinders"
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              placeholder="Welded cylinder for press and clamping applications."
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadDropzone onAdd={(added) => setSources((prev) => [...prev, ...added])} />

          <div className="space-y-2">
            <Label htmlFor="url">Product URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                value={url}
                placeholder="https://manufacturer.com/products/hc-5020"
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  if (!url.trim()) return;
                  setSources((prev) => [
                    ...prev,
                    {
                      id: `url-${Date.now()}`,
                      name: url.replace(/^https?:\/\//, ""),
                      type: "URL",
                      url,
                      status: "Ready",
                      ingestedAt: new Date().toISOString(),
                    },
                  ]);
                  setUrl("");
                  toast.success("Source added");
                }}
              >
                <Link2 className="size-4" /> Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add manufacturer pages, datasheets, catalogs, or product images.
            </p>
          </div>

          <div className="space-y-2">
            <p className="section-label">Source preview</p>
            {sources.length === 0 ? (
              <p className="text-xs text-muted-foreground">No document sources uploaded yet.</p>
            ) : (
              sources.map((source) => <SourceCard key={source.id} source={source} />)
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={() => toast.info("Draft saved")}
        >
          Save Draft
        </Button>
        <Button onClick={start} type="button">
          <Sparkles className="size-4" /> Generate Product Intelligence
        </Button>
      </div>
    </div>
  );
}

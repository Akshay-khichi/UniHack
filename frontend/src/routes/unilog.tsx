import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Upload, Sparkles, Download, AlertTriangle, CheckCircle, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  parseCsvFile,
  enrichBatchRows,
  downloadUnilogCsv,
  enrichSingleRow,
  type RawProductRow,
  type EnrichedProduct,
  type BatchEnrichResult,
} from "@/services/unilogService";

export const Route = createFileRoute("/unilog")({
  component: UnilogPage,
});

function confidenceBadge(confidence: number) {
  if (confidence >= 0.8) return <Badge className="bg-fact-surface text-fact-foreground text-[10px]">{(confidence * 100).toFixed(0)}%</Badge>;
  if (confidence >= 0.6) return <Badge className="bg-inference-surface text-inference-foreground text-[10px]">{(confidence * 100).toFixed(0)}%</Badge>;
  return <Badge className="bg-conflict-surface text-conflict-foreground text-[10px]">{(confidence * 100).toFixed(0)}%</Badge>;
}

function UnilogPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [rawRows, setRawRows] = useState<RawProductRow[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<BatchEnrichResult | null>(null);
  const [activeProduct, setActiveProduct] = useState<EnrichedProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"import" | "results">("import");

  // ─── File parsing ────────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    try {
      const rows = await parseCsvFile(file);
      if (rows.length === 0) {
        toast.error("No valid rows found in CSV");
        return;
      }
      setRawRows(rows);
      // Auto-select first 10
      setSelectedIdx(new Set(rows.slice(0, 10).map((_, i) => i)));
      toast.success(`${rows.length} rows loaded. First 10 selected.`);
    } catch {
      toast.error("Failed to parse CSV file");
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ─── Enrichment ──────────────────────────────────────────────────────────────
  const runEnrichment = async () => {
    const selected = rawRows.filter((_, i) => selectedIdx.has(i));
    if (selected.length === 0) {
      toast.error("Select at least one row to enrich");
      return;
    }
    setLoading(true);
    try {
      const res = await enrichBatchRows(selected, selected.length);
      setResult(res);
      setPhase("results");
      toast.success(`Enriched ${res.succeeded} products successfully`);
    } catch (err: unknown) {
      toast.error("Enrichment failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!result) return;
    const selected = rawRows.filter((_, i) => selectedIdx.has(i));
    try {
      await downloadUnilogCsv(selected);
      toast.success("252-column UniHack CSV downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  // ─── Toggle select ───────────────────────────────────────────────────────────
  const toggleRow = (i: number) => {
    setSelectedIdx((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  const selectAll = () => setSelectedIdx(new Set(rawRows.map((_, i) => i)));
  const selectNone = () => setSelectedIdx(new Set());

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">UniHack Enrichment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Import raw catalog rows, enrich with AI, export in Unilog's 252-column delivery format.
        </p>
      </div>

      {phase === "import" && (
        <>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
              isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-accent/30"
            }`}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".csv";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFile(file);
              };
              input.click();
            }}
          >
            <Upload className="mb-4 size-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Drop sample_input_dataset.csv here</p>
            <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Expected columns: Mfg_Part_Num, Part_Desc, E1_Brand, Unilog_Brand, DIB_Brand, Part_Manuf
            </p>
            <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  const sampleRows: RawProductRow[] = [
                    { Mfg_Part_Num: "PDSH4816AF", Part_Desc: "PDSH4816AF Dishwasher SS - Display Only", E1_Brand: "-- Unbranded --", Unilog_Brand: "-- No Unilog Brand --", DIB_Brand: "-- No DIB Brand --", Part_Manuf: "Appliance Dealers Cooperative (APPDE)" },
                    { Mfg_Part_Num: "WDTS7024RZ", Part_Desc: "WDTS7024RZ Dishwasher SS - Display Only", E1_Brand: "-- Unbranded --", Unilog_Brand: "-- No Unilog Brand --", DIB_Brand: "-- No DIB Brand --", Part_Manuf: "Appliance Dealers Cooperative (APPDE)" },
                    { Mfg_Part_Num: "GDF535PSSS", Part_Desc: "GDF535PSSS Dishwasher SS - Display Only", E1_Brand: "-- Unbranded --", Unilog_Brand: "-- No Unilog Brand --", DIB_Brand: "-- No DIB Brand --", Part_Manuf: "Appliance Dealers Cooperative (APPDE)" },
                    { Mfg_Part_Num: "DW80R2031US", Part_Desc: "DW80R2031US Dishwasher SS - Display Only", E1_Brand: "-- Unbranded --", Unilog_Brand: "-- No Unilog Brand --", DIB_Brand: "-- No DIB Brand --", Part_Manuf: "Appliance Dealers Cooperative (APPDE)" },
                    { Mfg_Part_Num: "LDFN4542S", Part_Desc: "LDFN4542S Dishwasher SS - Display Only", E1_Brand: "-- Unbranded --", Unilog_Brand: "-- No Unilog Brand --", DIB_Brand: "-- No DIB Brand --", Part_Manuf: "Appliance Dealers Cooperative (APPDE)" },
                  ];
                  setRawRows(sampleRows);
                  setSelectedIdx(new Set([0, 1, 2, 3, 4]));
                  toast.success("Loaded 5 sample items from UniHack dataset!");
                }}
              >
                <Sparkles className="size-3.5" />
                Load 5 Sample Items from UniHack Dataset
              </Button>
            </div>
          </div>

          {/* Row table */}
          {rawRows.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div>
                  <CardTitle className="text-base">{rawRows.length} rows loaded</CardTitle>
                  <CardDescription>{selectedIdx.size} selected for enrichment</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>Select all</Button>
                  <Button variant="outline" size="sm" onClick={selectNone}>None</Button>
                  <Button
                    size="sm"
                    disabled={loading || selectedIdx.size === 0}
                    onClick={runEnrichment}
                    className="gap-1.5"
                  >
                    <Sparkles className="size-3.5" />
                    {loading ? "Enriching…" : `Enrich ${selectedIdx.size} rows`}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                      <tr>
                        <th className="w-8 px-3 py-2"></th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">MPN</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Manufacturer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-b border-border/40 cursor-pointer hover:bg-accent/30 ${selectedIdx.has(i) ? "bg-accent/20" : ""}`}
                          onClick={() => toggleRow(i)}
                        >
                          <td className="px-3 py-2">
                            <input type="checkbox" readOnly checked={selectedIdx.has(i)} className="size-3.5 accent-primary" />
                          </td>
                          <td className="px-3 py-2 font-mono text-foreground">{row.Mfg_Part_Num}</td>
                          <td className="max-w-xs truncate px-3 py-2 text-muted-foreground">{row.Part_Desc}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.Part_Manuf}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {phase === "results" && result && (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Total", value: result.total, icon: FileText, color: "text-foreground" },
              { label: "Succeeded", value: result.succeeded, icon: CheckCircle, color: "text-fact" },
              { label: "Failed", value: result.failed, icon: AlertTriangle, color: "text-conflict" },
              { label: "Needs Review", value: result.needs_review, icon: AlertTriangle, color: "text-inference" },
              { label: "Avg Confidence", value: `${(result.avg_confidence * 100).toFixed(1)}%`, icon: BarChart3, color: "text-primary" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="p-4">
                <div className="flex items-center gap-2">
                  <Icon className={`size-4 ${color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`text-lg font-semibold ${color}`}>{value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setPhase("import"); setResult(null); setActiveProduct(null); }}>
              ← Back to Import
            </Button>
            <Button size="sm" onClick={handleDownloadCsv} className="gap-1.5 ml-auto">
              <Download className="size-3.5" />
              Download 252-Col UniHack CSV
            </Button>
          </div>

          {/* Results grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Left: product list */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Enriched Products</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-auto divide-y divide-border/40">
                  {result.results.map((product, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveProduct(product)}
                      className={`w-full px-4 py-3 text-left hover:bg-accent/30 transition-colors ${activeProduct === product ? "bg-accent/40" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground font-mono">{product.mfg_part_num}</p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{product.short_desc || product.raw_part_desc}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {confidenceBadge(product.overall_confidence)}
                          {product.needs_human_review && (
                            <Badge className="bg-conflict-surface text-conflict-foreground text-[9px]">Review</Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right: product detail */}
            {activeProduct ? (
              <Card className="overflow-hidden">
                <CardHeader className="py-3 border-b border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-mono">{activeProduct.mfg_part_num}</CardTitle>
                      <CardDescription className="text-xs">{activeProduct.classpath}</CardDescription>
                    </div>
                    {confidenceBadge(activeProduct.overall_confidence)}
                  </div>
                </CardHeader>
                <CardContent className="max-h-[560px] overflow-auto space-y-4 py-4 text-xs">
                  {/* Identifiers */}
                  <section>
                    <p className="section-label mb-1.5">Identifiers</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">Manufacturer</span>
                      <span className="font-medium text-foreground">{activeProduct.manufacturer_name}</span>
                      <span className="text-muted-foreground">Brand</span>
                      <span className="font-medium text-foreground">{activeProduct.brand_name}</span>
                      <span className="text-muted-foreground">Product Name</span>
                      <span className="font-medium text-foreground">{activeProduct.product_name}</span>
                    </div>
                  </section>

                  {/* 5-Tier Descriptions */}
                  <section>
                    <p className="section-label mb-1.5">5-Tier Descriptions</p>
                    <div className="space-y-2">
                      {[
                        { label: "INVOICE (≤40 ALL CAPS)", value: activeProduct.invoice_desc },
                        { label: "MOBILE (60–80 chars)", value: activeProduct.mobile_desc },
                        { label: "SHORT / TITLE", value: activeProduct.short_desc },
                        { label: "LONG DESCRIPTION", value: activeProduct.long_desc },
                        { label: "MARKETING", value: activeProduct.marketing_description },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-md bg-muted/40 p-2.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                          <p className="text-foreground leading-relaxed">{value || <em className="text-muted-foreground">—</em>}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Attributes */}
                  {activeProduct.attributes.length > 0 && (
                    <section>
                      <p className="section-label mb-1.5">Attributes ({activeProduct.attributes.length})</p>
                      <table className="w-full">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="py-1 text-left font-medium w-1/3">Label</th>
                            <th className="py-1 text-left font-medium">Value</th>
                            <th className="py-1 text-right font-medium">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeProduct.attributes.map((attr, j) => (
                            <tr key={j} className="border-t border-border/30">
                              <td className="py-1 text-muted-foreground">{attr.label}</td>
                              <td className="py-1 text-foreground">{attr.value}{attr.uom ? ` ${attr.uom}` : ""}</td>
                              <td className="py-1 text-right">{confidenceBadge(attr.confidence)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  )}

                  {/* Review flag */}
                  {activeProduct.needs_human_review && (
                    <div className="rounded-md border border-conflict/30 bg-conflict-surface p-3">
                      <div className="flex gap-2">
                        <AlertTriangle className="size-4 text-conflict shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-conflict-foreground">Needs Human Review</p>
                          <p className="mt-0.5 text-muted-foreground">{activeProduct.review_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {activeProduct.warnings.length > 0 && (
                    <div className="text-muted-foreground">
                      <p className="section-label mb-1">Warnings</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {activeProduct.warnings.map((w, j) => <li key={j}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="flex items-center justify-center p-12 text-center">
                <div>
                  <Sparkles className="mx-auto mb-3 size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Select a product to see enriched details</p>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

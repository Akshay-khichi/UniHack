// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UNILOG_BASE = (() => {
  const base = ((import.meta.env['VITE_API_URL'] as string | undefined) || "http://localhost:3000/api")
    .replace(/\/$/, "");
  // Strip trailing /api and reattach so we can mount /api/unilog cleanly
  const root = base.replace(/\/api$/, "");
  return `${root}/api/unilog`;
})();

export interface UnilogAttribute {
  label: string;
  value: string;
  uom: string | null;
  confidence: number;
}

export interface EnrichedProduct {
  mfg_part_num: string;
  raw_part_desc: string;
  manufacturer_name: string;
  brand_name: string;
  classpath: string;
  dept: string;
  class_name: string;
  fine: string;
  invoice_desc: string;
  mobile_desc: string;
  short_desc: string;
  long_desc: string;
  marketing_description: string;
  product_name: string;
  attributes: UnilogAttribute[];
  overall_confidence: number;
  needs_human_review: boolean;
  review_reason: string | null;
  warnings: string[];
  _error?: string;
}

export interface BatchEnrichResult {
  total: number;
  succeeded: number;
  failed: number;
  needs_review: number;
  avg_confidence: number;
  results: EnrichedProduct[];
}

export interface RawProductRow {
  Mfg_Part_Num: string;
  Part_Desc: string;
  E1_Brand?: string;
  Unilog_Brand?: string;
  DIB_Brand?: string;
  Part_Manuf: string;
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function splitCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else { current += ch; }
  }
  result.push(current);
  return result;
}

function parseCsv(text: string): RawProductRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvRow(lines[0]!);
  return lines.slice(1).map((line) => {
    const vals = splitCsvRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj as unknown as RawProductRow;
  }).filter((r) => r.Mfg_Part_Num || r.Part_Desc);
}

/** Parse a dropped/selected CSV file into raw rows */
export async function parseCsvFile(file: File): Promise<RawProductRow[]> {
  const text = await file.text();
  return parseCsv(text);
}

// ─── Shared fetch helper (avoids api.ts path prefix complications) ────────────

async function unilogFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${UNILOG_BASE}${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`UniHack API error ${res.status}: ${text}`);
  }
  const json = await res.json() as { data?: T };
  return (json.data ?? json) as T;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Enrich a single raw product row via AI */
export async function enrichSingleRow(row: RawProductRow): Promise<EnrichedProduct> {
  return unilogFetch<EnrichedProduct>("/enrich", {
    method: "POST",
    body: JSON.stringify(row),
  });
}

/** Batch enrich multiple rows, returns JSON summary */
export async function enrichBatchRows(
  rows: RawProductRow[],
  limit = 50,
): Promise<BatchEnrichResult> {
  return unilogFetch<BatchEnrichResult>(`/enrich/batch?format=json&limit=${limit}`, {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
}

/** Download 252-column UniHack CSV for given rows */
export async function downloadUnilogCsv(rows: RawProductRow[], filename = "unilog-enriched.csv"): Promise<void> {
  const res = await fetch(`${UNILOG_BASE}/enrich/batch?format=csv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) throw new Error(`CSV download failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Get the 252-column schema for reference */
export async function getUnilogSchema(): Promise<{ total_columns: number; headers: string[] }> {
  return unilogFetch("/schema");
}

export interface AccuracyMetric {
  category: string;
  score: number;
  passed: number;
  total: number;
  details: string;
}

export interface EvaluationReport {
  overall_score: number;
  timestamp: string;
  total_evaluated: number;
  metrics: AccuracyMetric[];
  benchmark_rows: Array<{
    mpn: string;
    ground_truth_classpath: string;
    predicted_classpath: string;
    classpath_matched: boolean;
    invoice_desc_valid: boolean;
    mobile_desc_valid: boolean;
    overall_row_score: number;
  }>;
}

/** Run accuracy evaluation benchmark against ground-truth CSV */
export async function runEvaluationBenchmark(limit = 10): Promise<EvaluationReport> {
  return unilogFetch<EvaluationReport>(`/evaluate?limit=${limit}`);
}


"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowUpTrayIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ParsedRow {
  cardName:        string;
  setName:         string;
  condition:       string;
  price:           string;
  quantity:        string;
  isGraded:        string;
  gradingCompany:  string;
  gradeValue:      string;
  isFoil:          string;
  isFirstEdition:  string;
  description:     string;
}

interface ResultRow {
  row:       number;
  cardName:  string;
  status:    "ok" | "error";
  error?:    string;
  listingId?: string;
}

// ── CSV preview parser ─────────────────────────────────────────────────────────

function parsePreview(text: string): ParsedRow[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const cols = lines[0].split(",").map((c) => c.trim().toLowerCase());
  return lines.slice(1, 11).map((line) => {
    const vals = line.split(",");
    const raw: Record<string, string> = {};
    cols.forEach((col, i) => { raw[col] = (vals[i] ?? "").trim(); });
    return {
      cardName:       raw["cardname"]       ?? raw["card_name"]        ?? "",
      setName:        raw["setname"]        ?? raw["set_name"]         ?? "",
      condition:      raw["condition"]      ?? "",
      price:          raw["price"]          ?? "",
      quantity:       raw["quantity"]       ?? "1",
      isGraded:       raw["isgraded"]       ?? raw["is_graded"]        ?? "FALSE",
      gradingCompany: raw["gradingcompany"] ?? raw["grading_company"]  ?? "none",
      gradeValue:     raw["gradevalue"]     ?? raw["grade_value"]      ?? "",
      isFoil:         raw["isfoil"]         ?? raw["is_foil"]          ?? "FALSE",
      isFirstEdition: raw["isfirstedition"] ?? raw["is_first_edition"] ?? "FALSE",
      description:    raw["description"]   ?? "",
    };
  });
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CSVImportForm() {
  const router = useRouter();

  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ created: number; failed: number; rows: ResultRow[] } | null>(null);
  const [downloading, setDownloading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((f: File) => {
    if (!f.name.endsWith(".csv")) { toast.error("Please upload a .csv file"); return; }
    setFile(f);
    setResults(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPreview(parsePreview(text));
    };
    reader.readAsText(f);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f);
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
  }

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const res  = await fetch("/api/listings/template");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "tcgmarketph-listing-template.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function runImport() {
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/listings/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Import failed"); return; }
      setResults({ created: data.created, failed: data.failed, rows: data.results });
      if (data.created > 0) toast.success(`${data.created} listing${data.created !== 1 ? "s" : ""} created`);
      if (data.failed  > 0) toast.error(`${data.failed} row${data.failed !== 1 ? "s" : ""} failed`);
    } catch {
      toast.error("Network error");
    } finally {
      setImporting(false);
    }
  }

  // ── After successful import ──────────────────────────────────────────────────
  if (results && results.failed === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircleIcon className="size-16 text-bid" />
        <h2 className="text-xl font-bold text-[#F2F2F2]">{results.created} listings created!</h2>
        <div className="flex gap-3">
          <button onClick={() => { setFile(null); setPreview([]); setResults(null); }} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-[#9A9A9A] hover:text-[#F2F2F2]">
            Import another file
          </button>
          <button onClick={() => router.push("/listings")} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white">
            View My Listings
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Template download */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface p-4">
        <div>
          <p className="font-semibold text-[#F2F2F2]">Download Template</p>
          <p className="text-xs text-[#9A9A9A]">Get a pre-filled CSV with all supported columns and example rows</p>
        </div>
        <button
          onClick={downloadTemplate}
          disabled={downloading}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-surface2 px-4 py-2 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="size-4" />
          {downloading ? "Downloading…" : "Download .csv"}
        </button>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 text-center transition ${
          dragging ? "border-accent/50 bg-accent/5" : "border-white/10 bg-surface hover:border-white/20"
        }`}
      >
        {file ? (
          <>
            <DocumentTextIcon className="size-10 text-bid" />
            <p className="font-semibold text-[#F2F2F2]">{file.name}</p>
            <p className="text-xs text-[#9A9A9A]">{(file.size / 1024).toFixed(1)} KB · click to replace</p>
          </>
        ) : (
          <>
            <ArrowUpTrayIcon className="size-10 text-[#9A9A9A]" />
            <p className="font-semibold text-[#F2F2F2]">Drop your CSV here</p>
            <p className="text-xs text-[#9A9A9A]">or click to browse · max 100 rows</p>
          </>
        )}
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onInput} />
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">
            Preview — first {preview.length} row{preview.length !== 1 ? "s" : ""}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-surface2 text-left text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">
                  {["Card", "Set", "Condition", "Price", "Qty", "Graded", "Description"].map((h) => (
                    <th key={h} className="px-4 py-3 first:rounded-tl-2xl last:rounded-tr-2xl">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-none">
                    <td className="px-4 py-3 font-medium text-[#F2F2F2]">{row.cardName || <span className="text-red-400">—</span>}</td>
                    <td className="px-4 py-3 text-[#9A9A9A]">{row.setName || "—"}</td>
                    <td className="px-4 py-3 text-[#9A9A9A]">{row.condition || "near_mint"}</td>
                    <td className="px-4 py-3 text-[#F2F2F2]">{row.price ? `₱${parseFloat(row.price).toLocaleString()}` : <span className="text-red-400">—</span>}</td>
                    <td className="px-4 py-3 text-[#9A9A9A]">{row.quantity || "1"}</td>
                    <td className="px-4 py-3 text-[#9A9A9A]">
                      {row.isGraded.toLowerCase() === "true" ? (
                        <span className="text-bid">{row.gradingCompany.toUpperCase()} {row.gradeValue}</span>
                      ) : "No"}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-[#9A9A9A]">{row.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import results */}
      {results && results.failed > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">
            Results — {results.created} created · {results.failed} failed
          </p>
          <div className="flex flex-col gap-1">
            {results.rows.map((r) => (
              <div key={r.row} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                r.status === "ok" ? "bg-bid/10 text-bid" : "bg-red-400/10 text-red-400"
              }`}>
                {r.status === "ok"
                  ? <CheckCircleIcon className="size-4 shrink-0" />
                  : <XCircleIcon     className="size-4 shrink-0" />}
                <span className="text-[#9A9A9A] mr-1">Row {r.row}:</span>
                <span className="font-medium">{r.cardName}</span>
                {r.error && <span className="ml-auto text-xs">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {file && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => { setFile(null); setPreview([]); setResults(null); }}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-[#9A9A9A] hover:text-[#F2F2F2]"
          >
            Clear
          </button>
          <button
            onClick={runImport}
            disabled={importing}
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 disabled:opacity-50"
          >
            {importing ? "Importing…" : `Import ${file.name}`}
          </button>
        </div>
      )}
    </div>
  );
}

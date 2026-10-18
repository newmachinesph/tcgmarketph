"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CardResult {
  id:       string;
  name:     string;
  setName:  string | null;
  game:     string;
  imageUrl: string | null;
}

interface BulkRow {
  id:          string;
  card:        CardResult | null;
  cardQuery:   string;
  condition:   string;
  price:       string;
  quantity:    string;
  isGraded:    boolean;
  gradingCo:   string;
  gradeValue:  string;
  description: string;
  // UI state
  searching:   boolean;
  suggestions: CardResult[];
  status:      "idle" | "ok" | "error";
  error:       string;
}

const CONDITIONS = [
  { value: "near_mint",         label: "Near Mint"         },
  { value: "lightly_played",    label: "Lightly Played"    },
  { value: "moderately_played", label: "Moderately Played" },
  { value: "heavily_played",    label: "Heavily Played"    },
  { value: "damaged",           label: "Damaged"           },
];

const GRADING_COS = ["none", "psa", "bgs", "cgc"];

function makeRow(): BulkRow {
  return {
    id:          crypto.randomUUID(),
    card:        null,
    cardQuery:   "",
    condition:   "near_mint",
    price:       "",
    quantity:    "1",
    isGraded:    false,
    gradingCo:   "none",
    gradeValue:  "",
    description: "",
    searching:   false,
    suggestions: [],
    status:      "idle",
    error:       "",
  };
}

// ── Card search ────────────────────────────────────────────────────────────────

function useCardSearch(rows: BulkRow[], setRows: React.Dispatch<React.SetStateAction<BulkRow[]>>) {
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const search = useCallback((rowId: string, q: string) => {
    setRows((prev) =>
      prev.map((r) => r.id === rowId ? { ...r, cardQuery: q, card: null, suggestions: [] } : r)
    );

    if (timers.current[rowId]) clearTimeout(timers.current[rowId]);
    if (q.length < 2) return;

    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, searching: true } : r));

    timers.current[rowId] = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/cards/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setRows((prev) =>
          prev.map((r) => r.id === rowId ? { ...r, searching: false, suggestions: data.cards?.slice(0, 6) ?? [] } : r)
        );
      } catch {
        setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, searching: false } : r));
      }
    }, 300);
  }, [setRows]);

  const select = useCallback((rowId: string, card: CardResult) => {
    setRows((prev) =>
      prev.map((r) => r.id === rowId ? { ...r, card, cardQuery: card.name, suggestions: [] } : r)
    );
  }, [setRows]);

  return { search, select };
}

// ── Row component ──────────────────────────────────────────────────────────────

function BulkRow({
  row, index, onChange, onRemove, onSearchCard, onSelectCard,
}: {
  row:          BulkRow;
  index:        number;
  onChange:     (id: string, field: string, value: string | boolean) => void;
  onRemove:     (id: string) => void;
  onSearchCard: (id: string, q: string) => void;
  onSelectCard: (id: string, card: CardResult) => void;
}) {
  return (
    <div className={`rounded-2xl border p-4 transition ${
      row.status === "ok"    ? "border-bid/30 bg-bid/5"    :
      row.status === "error" ? "border-red-400/30 bg-red-400/5" :
      "border-white/10 bg-surface"
    }`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-surface2 text-xs font-bold text-[#9A9A9A]">
          {index + 1}
        </span>
        {row.status === "ok"    && <CheckCircleIcon className="size-4 text-bid" />}
        {row.status === "error" && <span className="text-xs text-red-400">{row.error}</span>}
        <button
          onClick={() => onRemove(row.id)}
          className="ml-auto rounded-lg p-1 text-[#9A9A9A] hover:bg-surface2 hover:text-accent"
        >
          <TrashIcon className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card search */}
        <div className="relative sm:col-span-2">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Card *</label>
          <input
            type="text"
            placeholder="Search card name…"
            value={row.cardQuery}
            onChange={(e) => onSearchCard(row.id, e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
          {row.searching && (
            <p className="mt-1 text-[10px] text-[#9A9A9A]">Searching…</p>
          )}
          {row.suggestions.length > 0 && (
            <ul className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-surface shadow-xl">
              {row.suggestions.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCard(row.id, c)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#F2F2F2]">{c.name}</p>
                      <p className="truncate text-[10px] text-[#9A9A9A]">{c.setName ?? c.game}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {row.card && (
            <p className="mt-1 text-[10px] text-bid">✓ {row.card.name} · {row.card.setName}</p>
          )}
        </div>

        {/* Condition */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Condition</label>
          <select
            value={row.condition}
            onChange={(e) => onChange(row.id, "condition", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] focus:border-white/20 focus:outline-none"
          >
            {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Price (₱) *</label>
          <input
            type="number"
            min={1}
            placeholder="e.g. 1500"
            value={row.price}
            onChange={(e) => onChange(row.id, "price", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
        </div>

        {/* Qty */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Qty</label>
          <input
            type="number"
            min={1}
            max={99}
            value={row.quantity}
            onChange={(e) => onChange(row.id, "quantity", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] focus:border-white/20 focus:outline-none"
          />
        </div>

        {/* Graded toggle */}
        <div className="flex items-center gap-3 self-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#9A9A9A]">
            <input
              type="checkbox"
              checked={row.isGraded}
              onChange={(e) => onChange(row.id, "isGraded", e.target.checked)}
              className="size-4 accent-accent"
            />
            Graded
          </label>
        </div>

        {/* Grading fields */}
        {row.isGraded && (
          <>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Grader</label>
              <select
                value={row.gradingCo}
                onChange={(e) => onChange(row.id, "gradingCo", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] uppercase focus:border-white/20 focus:outline-none"
              >
                {GRADING_COS.map((g) => <option key={g} value={g}>{g.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Grade</label>
              <input
                type="number"
                min={1}
                max={10}
                step={0.5}
                placeholder="e.g. 9.5"
                value={row.gradeValue}
                onChange={(e) => onChange(row.id, "gradeValue", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
              />
            </div>
          </>
        )}

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Note (optional)</label>
          <input
            type="text"
            maxLength={200}
            placeholder="Short description…"
            value={row.description}
            onChange={(e) => onChange(row.id, "description", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────────

export function BulkListingForm() {
  const router   = useRouter();
  const [rows, setRows]       = useState<BulkRow[]>([makeRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);
  const [summary, setSummary] = useState({ created: 0, failed: 0 });

  const { search, select } = useCardSearch(rows, setRows);

  function addRow() {
    if (rows.length >= 20) { toast.error("Max 20 rows per bulk submission"); return; }
    setRows((prev) => [...prev, makeRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);
  }

  function onChange(id: string, field: string, value: string | boolean) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  async function submit() {
    const valid = rows.filter((r) => r.card && r.price);
    if (valid.length === 0) { toast.error("Fill in at least one card with a price"); return; }

    setSubmitting(true);
    let created = 0, failed = 0;

    for (const row of rows) {
      if (!row.card || !row.price) {
        setRows((prev) =>
          prev.map((r) => r.id === row.id ? { ...r, status: "error", error: "Card and price required" } : r)
        );
        failed++;
        continue;
      }

      const body = {
        cardId:         row.card.id,
        condition:      row.condition,
        isGraded:       row.isGraded,
        gradingCompany: row.isGraded ? row.gradingCo : "none",
        gradeValue:     row.isGraded && row.gradeValue ? parseFloat(row.gradeValue) : undefined,
        isFoil:         false,
        isFirstEdition: false,
        type:           "fixed_price",
        price:          parseFloat(row.price),
        quantity:       parseInt(row.quantity, 10) || 1,
        description:    row.description || undefined,
        photoUrls:      [],
      };

      const res = await fetch("/api/listings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (res.ok) {
        created++;
        setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "ok" } : r));
      } else {
        failed++;
        const data = await res.json().catch(() => ({}));
        const msg  = typeof data.error === "string" ? data.error : "Failed";
        setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "error", error: msg } : r));
      }
    }

    setSubmitting(false);
    setSummary({ created, failed });
    setDone(true);
    if (created > 0) toast.success(`${created} listing${created !== 1 ? "s" : ""} created`);
    if (failed  > 0) toast.error(`${failed} row${failed !== 1 ? "s" : ""} failed — see details`);
  }

  if (done && summary.failed === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircleIcon className="size-16 text-bid" />
        <h2 className="text-xl font-bold text-[#F2F2F2]">{summary.created} listings created!</h2>
        <div className="flex gap-3">
          <button onClick={() => { setRows([makeRow()]); setDone(false); }} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-[#9A9A9A] hover:text-[#F2F2F2]">
            Add more
          </button>
          <button onClick={() => router.push("/listings")} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white">
            View My Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, i) => (
        <BulkRow
          key={row.id}
          row={row}
          index={i}
          onChange={onChange}
          onRemove={removeRow}
          onSearchCard={search}
          onSelectCard={select}
        />
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={addRow}
          disabled={rows.length >= 20}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-40"
        >
          <PlusIcon className="size-4" />
          Add row {rows.length < 20 ? `(${rows.length}/20)` : "(max)"}
        </button>

        <button
          onClick={submit}
          disabled={submitting}
          className="ml-auto rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 disabled:opacity-50"
        >
          {submitting ? "Creating listings…" : `List ${rows.filter((r) => r.card && r.price).length || rows.length} card${rows.length !== 1 ? "s" : ""}`}
        </button>
      </div>

      {done && summary.failed > 0 && (
        <p className="text-sm text-[#9A9A9A]">
          {summary.created} created · {summary.failed} failed — rows in red need attention.
          <button onClick={() => { setDone(false); }} className="ml-2 text-accent hover:underline">Retry failed</button>
        </p>
      )}
    </div>
  );
}

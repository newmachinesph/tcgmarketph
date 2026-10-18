"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { CONDITIONS, CONDITION_LABEL } from "@/lib/validations/listing";

const GAMES = [
  { value: "pokemon",   label: "Pokémon"   },
  { value: "one_piece", label: "One Piece" },
  { value: "any",       label: "Any game"  },
];

export default function WantedNewPage() {
  const router = useRouter();

  const [game, setGame]               = useState("pokemon");
  const [cardName, setCardName]       = useState("");
  const [setName, setSetName]         = useState("");
  const [conditionMode, setConditionMode] = useState<"any" | "specific">("any");
  const [conditions, setConditions]   = useState<string[]>([]);
  const [maxPrice, setMaxPrice]       = useState("");
  const [negotiable, setNegotiable]   = useState(true);
  const [notes, setNotes]             = useState("");

  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  function toggleCondition(c: string) {
    setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!cardName.trim()) { setError("Card name is required."); return; }

    const condition = conditionMode === "any" ? "any" : conditions.join(",") || "any";

    const body: Record<string, unknown> = {
      game,
      cardName: cardName.trim(),
      setName:  setName.trim() || undefined,
      condition,
      negotiable,
      notes:    notes.trim() || undefined,
    };
    if (maxPrice && parseFloat(maxPrice) > 0) body.maxPricePHP = parseFloat(maxPrice);

    setSubmitting(true);
    const res  = await fetch("/api/wanted", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    router.push(`/wanted/${data.item.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10 lg:px-10">
      <Link href="/wanted" className="mb-6 flex items-center gap-1.5 text-xs text-[#9A9A9A] hover:text-[#F2F2F2]">
        <ArrowLeftIcon className="size-3.5" /> Back to Wanted
      </Link>

      <h1 className="mb-1 text-2xl font-bold tracking-tight text-[#F2F2F2]">Post a Wanted Request</h1>
      <p className="mb-8 text-sm text-[#9A9A9A]">Tell sellers what card you're looking for and what you're willing to pay.</p>

      <form onSubmit={submit} className="space-y-6">

        {/* Game */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#9A9A9A]">Game</label>
          <div className="flex flex-wrap gap-2">
            {GAMES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setGame(value)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  game === value
                    ? "bg-accent text-white"
                    : "border border-white/10 text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Card name */}
        <div>
          <label htmlFor="cardName" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#9A9A9A]">
            Card Name <span className="text-red-400">*</span>
          </label>
          <input
            id="cardName"
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            maxLength={120}
            placeholder="e.g. Charizard ex, Monkey D. Luffy, Pikachu V"
            className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
        </div>

        {/* Set name */}
        <div>
          <label htmlFor="setName" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#9A9A9A]">
            Set / Expansion <span className="text-[#9A9A9A] font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <input
            id="setName"
            type="text"
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            maxLength={120}
            placeholder="e.g. Surging Sparks, 151, Paramount War"
            className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
        </div>

        {/* Condition */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#9A9A9A]">Condition</label>
          <div className="mb-3 flex gap-3">
            <button
              type="button"
              onClick={() => setConditionMode("any")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                conditionMode === "any"
                  ? "bg-accent text-white"
                  : "border border-white/10 text-[#9A9A9A] hover:border-white/20"
              }`}
            >
              Any condition
            </button>
            <button
              type="button"
              onClick={() => setConditionMode("specific")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                conditionMode === "specific"
                  ? "bg-accent text-white"
                  : "border border-white/10 text-[#9A9A9A] hover:border-white/20"
              }`}
            >
              Specific conditions
            </button>
          </div>
          {conditionMode === "specific" && (
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCondition(c)}
                  className={`rounded-xl px-3 py-1.5 text-sm transition ${
                    conditions.includes(c)
                      ? "bg-accent/20 text-accent border border-accent/40"
                      : "border border-white/10 text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]"
                  }`}
                >
                  {CONDITION_LABEL[c]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Budget */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#9A9A9A]">
            Max Budget (₱) <span className="text-[#9A9A9A] font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#9A9A9A]">₱</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min={0}
              step="0.01"
              placeholder="0.00"
              className="w-40 rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
            />
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm text-[#9A9A9A] cursor-pointer">
            <input
              type="checkbox"
              checked={negotiable}
              onChange={(e) => setNegotiable(e.target.checked)}
              className="accent-accent"
            />
            Price is negotiable
          </label>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#9A9A9A]">
            Additional Notes <span className="text-[#9A9A9A] font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Any specific details — language, art variant, ink color, etc."
            className="w-full resize-none rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-[#9A9A9A]">{notes.length}/500</p>
        </div>

        {error && <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-3 border-t border-white/5 pt-4">
          <button
            type="submit"
            disabled={submitting || !cardName.trim()}
            className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post Request"}
          </button>
          <Link href="/wanted" className="text-sm text-[#9A9A9A] hover:text-[#F2F2F2]">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

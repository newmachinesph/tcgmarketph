"use client";

import { useState } from "react";
import { FlagIcon } from "@heroicons/react/24/outline";

const REASONS: Record<string, string[]> = {
  user: [
    "Abusive behaviour",
    "Scam / fraud attempt",
    "Spam",
    "Fake account",
    "Other",
  ],
  listing: [
    "Counterfeit card",
    "Misleading description / photos",
    "Wrong price / bait and switch",
    "Prohibited item",
    "Spam listing",
    "Other",
  ],
  message: [
    "Harassment",
    "Threats",
    "Spam",
    "Scam attempt",
    "Other",
  ],
};

interface Props {
  targetType: "user" | "listing" | "message";
  targetId:   string;
  label?:     string;
}

export function ReportButton({ targetType, targetId, label }: Props) {
  const [open, setOpen]         = useState(false);
  const [reason, setReason]     = useState("");
  const [details, setDetails]   = useState("");
  const [working, setWorking]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  const reasons = REASONS[targetType] ?? [];

  async function submit() {
    if (!reason) { setError("Please select a reason."); return; }
    setWorking(true);
    setError("");
    const res = await fetch("/api/reports", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ targetType, targetId, reason, details: details || undefined }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => { setOpen(false); setDone(false); setReason(""); setDetails(""); }, 2000);
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to submit report.");
    }
    setWorking(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#9A9A9A] transition hover:text-red-400"
      >
        <FlagIcon className="size-3.5" />
        {label ?? "Report"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-primary p-6 shadow-xl">
            {done ? (
              <div className="text-center py-4">
                <p className="text-sm font-semibold text-emerald-400">Report submitted. Thank you.</p>
              </div>
            ) : (
              <>
                <h2 className="mb-4 text-base font-semibold text-[#F2F2F2]">
                  Report {targetType}
                </h2>

                <div className="mb-3 space-y-2">
                  {reasons.map((r) => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="accent-accent"
                      />
                      <span className="text-sm text-[#F2F2F2]">{r}</span>
                    </label>
                  ))}
                </div>

                <textarea
                  placeholder="Additional details (optional)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="mb-3 w-full resize-none rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
                />

                {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={working}
                    className="flex-1 rounded-xl bg-red-500/20 border border-red-500/30 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {working ? "Submitting…" : "Submit Report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

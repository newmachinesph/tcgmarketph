"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircleIcon, PhoneIcon } from "@heroicons/react/24/outline";

interface PhoneVerifyProps {
  phone: string | null | undefined;
  phoneVerified: boolean;
  onVerified: () => void;
}

type State = "idle" | "sending" | "awaiting_code" | "verifying";

export function PhoneVerify({ phone, phoneVerified, onVerified }: PhoneVerifyProps) {
  const [state, setState] = useState<State>("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!phone) return null;

  if (phoneVerified) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-bid/20 bg-bid/10 px-4 py-3">
        <CheckCircleIcon className="size-4 shrink-0 text-bid" />
        <div>
          <p className="text-sm font-semibold text-bid">Phone verified</p>
          <p className="text-xs text-bid/70">{phone}</p>
        </div>
      </div>
    );
  }

  async function sendOtp() {
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/otp/send", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send OTP.");
        setState("idle");
      } else {
        setState("awaiting_code");
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch {
      setError("Network error. Please try again.");
      setState("idle");
    }
  }

  async function verifyOtp() {
    if (code.length !== 6) return;
    setState("verifying");
    setError(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        setState("awaiting_code");
      } else {
        toast.success("Phone verified! You can now list cards.");
        onVerified();
      }
    } catch {
      setError("Network error. Please try again.");
      setState("awaiting_code");
    }
  }

  const busy = state === "sending" || state === "verifying";

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <PhoneIcon className="size-4 shrink-0 text-accent" />
        <p className="text-sm font-semibold text-[#F2F2F2]">Verify your number</p>
        <span className="ml-auto rounded bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-yellow-400">
          Unverified
        </span>
      </div>

      <p className="text-xs text-[#9A9A9A]">
        {state === "awaiting_code" || state === "verifying"
          ? `Enter the 6-digit code sent to ${phone}.`
          : `Verify ${phone} to unlock card listing.`}
      </p>

      {(state === "idle" || state === "sending") && (
        <button
          onClick={sendOtp}
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
        >
          {state === "sending" ? "Sending…" : "Send OTP"}
        </button>
      )}

      {(state === "awaiting_code" || state === "verifying") && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
            placeholder="123456"
            className="w-28 rounded-lg border border-white/10 bg-surface px-3 py-2 text-center font-mono text-sm tracking-widest text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
          />
          <button
            onClick={verifyOtp}
            disabled={code.length !== 6 || busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
          >
            {state === "verifying" ? "Verifying…" : "Verify"}
          </button>
          <button
            onClick={() => { setState("idle"); setCode(""); setError(null); }}
            disabled={busy}
            className="text-xs text-[#9A9A9A] hover:text-[#F2F2F2] transition disabled:opacity-50"
          >
            Resend
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-ask">{error}</p>
      )}
    </div>
  );
}

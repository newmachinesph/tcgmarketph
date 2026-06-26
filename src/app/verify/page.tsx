"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { PhoneVerify } from "@/components/PhoneVerify";
import {
  CheckCircleIcon,
  IdentificationIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// ── Step indicator (shared style with profile-setup) ──────────────────────────

function Steps({ current }: { current: number }) {
  const steps = [
    { label: "Account" },
    { label: "Profile" },
    { label: "Verify" },
  ];
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {steps.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={step.label} className="flex items-center gap-2">
            <div className={[
              "flex size-7 items-center justify-center rounded-full text-xs font-bold",
              done   ? "bg-bid/20 text-bid"     :
              active ? "bg-accent text-white"   :
                       "border border-white/10 bg-surface text-[#9A9A9A]",
            ].join(" ")}>
              {done ? "✓" : i + 1}
            </div>
            <span className={`text-xs font-medium ${active ? "text-[#F2F2F2]" : "text-[#9A9A9A]"}`}>
              {step.label}
            </span>
            {i < steps.length - 1 && <div className="h-px w-6 bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}

// ── KYC status card ───────────────────────────────────────────────────────────

function KycCard({ kycStatus }: { kycStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function start() {
    setLoading(true);
    setError("");
    const res  = await fetch("/api/kyc/start", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ callbackPath: "/verify" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not start verification");
    } else {
      window.location.href = data.verificationUrl;
    }
  }

  if (kycStatus === "verified") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-bid/20 bg-bid/10 p-4">
        <ShieldCheckIcon className="size-5 shrink-0 text-bid" />
        <div>
          <p className="text-sm font-semibold text-bid">ID verified</p>
          <p className="text-xs text-bid/70">Your identity has been confirmed by Didit.</p>
        </div>
      </div>
    );
  }

  if (kycStatus === "pending") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4">
        <ExclamationTriangleIcon className="size-5 shrink-0 text-yellow-400" />
        <div>
          <p className="text-sm font-semibold text-yellow-300">Verification in review</p>
          <p className="text-xs text-yellow-400/70">Didit is reviewing your submission — usually takes a few minutes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-surface2 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <IdentificationIcon className="mt-0.5 size-5 shrink-0 text-[#9A9A9A]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#F2F2F2]">ID verification via Didit</p>
          <p className="mt-0.5 text-xs text-[#9A9A9A]">
            Upload a government-issued ID. Adds a verified badge to your profile and builds buyer trust.
            Takes about 2 minutes.
          </p>
          <ul className="mt-2 space-y-0.5 text-[11px] text-[#9A9A9A]">
            {["Higher buyer trust and more offers", "Required to become a Power Seller", "Badge displayed on your profile and listings"].map((b) => (
              <li key={b} className="flex items-center gap-1.5">
                <CheckCircleIcon className="size-3 shrink-0 text-bid" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        onClick={start}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-surface px-4 py-2 text-sm font-medium text-[#F2F2F2] border border-white/10 transition hover:border-white/20 disabled:opacity-50"
      >
        <IdentificationIcon className="size-4" />
        {loading ? "Starting…" : "Start ID verification"}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const searchParams = useSearchParams();

  // Track phone verification locally so the UI updates immediately on success
  const [localPhoneVerified, setLocalPhoneVerified] = useState<boolean | null>(null);

  // When Didit redirects back with ?kyc=done, refresh the session to pick up kycStatus
  useEffect(() => {
    if (searchParams.get("kyc") === "done") {
      refetch?.();
    }
  }, [searchParams, refetch]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    window.location.href = "/login";
    return null;
  }

  const user          = session?.user as Record<string, unknown> | undefined;
  const phone         = user?.phone         as string | null | undefined;
  const phoneVerified = localPhoneVerified ?? (user?.phoneVerified as boolean | undefined) ?? false;
  const kycStatus     = user?.kycStatus     as string | undefined ?? "none";

  function handleVerified() {
    setLocalPhoneVerified(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4 py-12">
      <div className="w-full max-w-lg">

        <Steps current={2} />

        <div className="rounded-2xl border border-white/10 bg-surface p-8 shadow-2xl shadow-black/40 space-y-7">

          {/* Header */}
          <div>
            <h1 className="text-xl font-bold text-[#F2F2F2]">Verify your account</h1>
            <p className="mt-1 text-sm text-[#9A9A9A]">
              Phone verification lets you list cards. ID verification unlocks seller trust badges.
            </p>
          </div>

          {/* ── Phone verification ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">
                Phone verification
              </p>
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                Required to list
              </span>
            </div>

            {!phone ? (
              <div className="rounded-xl border border-white/10 bg-surface2 p-4">
                <p className="text-sm text-[#9A9A9A]">
                  No phone number on your profile.{" "}
                  <Link href="/profile-setup" className="text-accent hover:underline">
                    Go back and add one.
                  </Link>
                </p>
              </div>
            ) : (
              <PhoneVerify
                phone={phone}
                phoneVerified={phoneVerified}
                onVerified={handleVerified}
              />
            )}
          </div>

          {/* ── KYC ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">
                ID verification
              </p>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#9A9A9A]">
                Optional
              </span>
            </div>
            <KycCard kycStatus={kycStatus} />
          </div>

          {/* ── Continue ── */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <button
              onClick={() => { window.location.href = "/dashboard"; }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              {phoneVerified ? "Go to Dashboard" : "Skip verification for now"}
              <ArrowRightIcon className="size-4" />
            </button>
            {!phoneVerified && (
              <p className="text-center text-xs text-[#9A9A9A]">
                You can verify your phone anytime in{" "}
                <Link href="/settings" className="text-accent hover:underline">Settings</Link>.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

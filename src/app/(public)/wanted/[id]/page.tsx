"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";
import { GAME_LABEL } from "@/lib/constants/games";
import { CONDITION_LABEL } from "@/lib/validations/listing";

interface WantedDetail {
  id:          string;
  userId:      string;
  game:        string;
  cardName:    string;
  setName:     string | null;
  condition:   string;
  maxPricePHP: string | null;
  negotiable:  boolean;
  notes:       string | null;
  status:      string;
  expiresAt:   string;
  createdAt:   string;
  poster: { id: string; name: string; image: string | null; city: string | null };
}

function timeLeft(iso: string) {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "Expired";
  if (days === 1) return "Expires tomorrow";
  return `${days} days left`;
}

function ConditionDisplay({ value }: { value: string }) {
  if (value === "any") return <span className="text-[#F2F2F2]">Any condition accepted</span>;
  const parts = value.split(",").map((c) => CONDITION_LABEL[c.trim()] ?? c.trim());
  return <span className="text-[#F2F2F2]">{parts.join(", ")}</span>;
}

export default function WantedDetailPage() {
  const { id }           = useParams<{ id: string }>();
  const router           = useRouter();
  const { data: session } = authClient.useSession();

  const [item, setItem]       = useState<WantedDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm]       = useState(false);
  const [message, setMessage]         = useState("");
  const [listingId, setListingId]     = useState("");
  const [sending, setSending]         = useState(false);
  const [sent, setSent]               = useState(false);
  const [formError, setFormError]     = useState("");

  const [closing, setClosing]   = useState(false);
  const [closeError, setCloseError] = useState("");

  useEffect(() => {
    fetch(`/api/wanted/${id}`)
      .then((r) => r.json())
      .then((d) => { setItem(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function respond() {
    if (!message.trim() || message.trim().length < 5) {
      setFormError("Message must be at least 5 characters.");
      return;
    }
    setSending(true);
    setFormError("");
    const res = await fetch(`/api/wanted/${id}/respond`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: message.trim(), listingId: listingId.trim() || undefined }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) { setFormError(data.error ?? "Failed to send"); return; }
    setSent(true);
    setTimeout(() => router.push(`/messages/${data.conversationId}`), 1200);
  }

  async function closeRequest(status: "filled" | "cancelled") {
    setClosing(true);
    setCloseError("");
    const res = await fetch(`/api/wanted/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    setClosing(false);
    if (!res.ok) { const d = await res.json(); setCloseError(d.error ?? "Failed"); return; }
    setItem((prev) => prev ? { ...prev, status } : prev);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />)}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10 text-center">
        <p className="text-[#9A9A9A]">Request not found.</p>
        <Link href="/wanted" className="mt-3 inline-block text-sm text-accent hover:underline">← Back to Wanted</Link>
      </div>
    );
  }

  const isOwner  = session?.user.id === item.userId;
  const isOpen   = item.status === "open";
  const canReply = session && !isOwner && isOpen;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10 lg:px-10">
      <Link href="/wanted" className="mb-6 flex items-center gap-1.5 text-xs text-[#9A9A9A] hover:text-[#F2F2F2]">
        <ArrowLeftIcon className="size-3.5" /> Back to Wanted
      </Link>

      {/* Status banner */}
      {!isOpen && (
        <div className={`mb-4 rounded-2xl border p-4 ${
          item.status === "filled"    ? "border-emerald-400/30 bg-emerald-400/10" :
          item.status === "cancelled" ? "border-white/10 bg-white/5"              :
                                        "border-yellow-400/30 bg-yellow-400/10"
        }`}>
          <p className={`text-sm font-semibold ${
            item.status === "filled" ? "text-emerald-400" :
            item.status === "cancelled" ? "text-[#9A9A9A]" : "text-yellow-400"
          }`}>
            {item.status === "filled"    ? "Found — this request has been filled" :
             item.status === "cancelled" ? "Cancelled"                            :
                                           "Expired"}
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-surface p-6 space-y-5">

        {/* Game + title */}
        <div>
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
            {item.game === "any" ? "Any game" : (GAME_LABEL[item.game] ?? item.game)}
          </span>
          <h1 className="mt-2 text-xl font-bold text-[#F2F2F2]">{item.cardName}</h1>
          {item.setName && <p className="mt-0.5 text-sm text-[#9A9A9A]">{item.setName}</p>}
        </div>

        {/* Details */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Condition</dt>
            <dd className="mt-0.5"><ConditionDisplay value={item.condition} /></dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Budget</dt>
            <dd className="mt-0.5 text-[#F2F2F2]">
              {item.maxPricePHP
                ? <>Up to ₱{parseFloat(item.maxPricePHP).toLocaleString("en-PH", { minimumFractionDigits: 2 })}{item.negotiable && " (negotiable)"}</>
                : item.negotiable ? "Negotiable" : "Not specified"}
            </dd>
          </div>
        </dl>

        {item.notes && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#F2F2F2]">{item.notes}</p>
          </div>
        )}

        {/* Poster */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface2 p-3">
          {item.poster.image ? (
            <Image src={item.poster.image} alt={item.poster.name} width={36} height={36} className="size-9 rounded-full object-cover" />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-full bg-surface text-sm font-bold text-[#9A9A9A]">
              {item.poster.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <Link href={`/sellers/${item.poster.id}`} className="text-sm font-semibold text-[#F2F2F2] hover:underline">
              {item.poster.name}
            </Link>
            {item.poster.city && (
              <p className="flex items-center gap-1 text-xs text-[#9A9A9A]">
                <MapPinIcon className="size-3" /> {item.poster.city}
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-[#9A9A9A]">
            <ClockIcon className="size-3.5" />
            {timeLeft(item.expiresAt)}
          </div>
        </div>

        {/* Owner actions */}
        {isOwner && isOpen && (
          <div className="space-y-2 border-t border-white/5 pt-4">
            <p className="text-xs text-[#9A9A9A]">Manage your request:</p>
            {closeError && <p className="text-xs text-red-400">{closeError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => closeRequest("filled")}
                disabled={closing}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-400/20 disabled:opacity-50"
              >
                <CheckCircleIcon className="size-4" /> Mark as filled
              </button>
              <button
                onClick={() => closeRequest("cancelled")}
                disabled={closing}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 disabled:opacity-50"
              >
                <XMarkIcon className="size-4" /> Cancel request
              </button>
            </div>
          </div>
        )}

        {/* Respond CTA */}
        {canReply && !showForm && !sent && (
          <div className="border-t border-white/5 pt-4">
            <button
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              <ChatBubbleLeftEllipsisIcon className="size-4" /> I have this — send a message
            </button>
          </div>
        )}

        {!session && isOpen && (
          <div className="border-t border-white/5 pt-4">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20"
            >
              Sign in to respond
            </Link>
          </div>
        )}

        {/* Respond form */}
        {showForm && !sent && (
          <div className="border-t border-white/5 pt-4 space-y-3">
            <p className="text-sm font-semibold text-[#F2F2F2]">Send a message to {item.poster.name}</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={`Hi, I have a ${item.cardName}${item.setName ? ` from ${item.setName}` : ""}. Here's what I can offer...`}
              className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none resize-none"
            />
            <div className="space-y-2">
              <p className="text-xs text-[#9A9A9A]">Listing ID (optional — paste your listing ID to share it directly)</p>
              <input
                type="text"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                placeholder="e.g. clxxxxx..."
                className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
              />
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={respond}
                disabled={sending || message.trim().length < 5}
                className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send message"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm text-[#9A9A9A] hover:text-[#F2F2F2]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {sent && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-400">
            <CheckCircleIcon className="size-4" /> Message sent! Redirecting to conversation…
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  StarIcon,
  MapPinIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  CreditCardIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { CONDITION_LABEL } from "@/lib/validations/listing";

// ── Types ────────────────────────────────────────────────────────────────────

interface MeetupProposal {
  id: string;
  proposerId: string;
  location: string;
  proposedAt: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

interface TxnUser {
  id: string;
  name: string;
  displayName: string | null;
  image: string | null;
  city: string | null;
  phoneVerified: boolean;
  reputationScore: number;
}

interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  agreedPrice: string;
  quantity: number;
  method: string;
  status: string;
  buyerNote: string | null;
  cancelReason: string | null;
  paymongoCheckoutUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  card: { name: string; setName: string | null; game: string; imageUrl: string | null };
  buyer: TxnUser;
  seller: TxnUser;
  meetups: MeetupProposal[];
  role: "buyer" | "seller";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending seller confirmation", color: "text-yellow-400",  bg: "bg-yellow-400/10 border-yellow-400/30" },
  agreed:    { label: "Agreed — arrange meetup",     color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/30" },
  completed: { label: "Completed",                   color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  cancelled: { label: "Cancelled",                   color: "text-[#9A9A9A]",   bg: "bg-white/5 border-white/10" },
  no_show:   { label: "No-show reported",            color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/30" },
  disputed:  { label: "Disputed",                    color: "text-red-400",     bg: "bg-red-400/10 border-red-400/30" },
};

function PaymentBadge({ method, paidAt, checkoutUrl, isBuyer }: {
  method:      string;
  paidAt:      string | null;
  checkoutUrl: string | null;
  isBuyer:     boolean;
}) {
  if (method !== "online") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-surface2 px-2.5 py-1 text-[10px] font-semibold text-[#9A9A9A]">
        <BanknotesIcon className="size-3" /> Cash on meetup
      </span>
    );
  }
  if (paidAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
        <CreditCardIcon className="size-3" /> Paid online ✓
      </span>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-semibold text-yellow-400">
        <CreditCardIcon className="size-3" /> Awaiting payment
      </span>
      {isBuyer && checkoutUrl && (
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-accent/80 transition"
        >
          Pay Now →
        </a>
      )}
    </div>
  );
}

function formatPHP(price: string | number) {
  return "₱" + parseFloat(String(price)).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

function UserCard({ user, label }: { user: TxnUser; label: string }) {
  const name = user.displayName ?? user.name;
  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">{label}</p>
      <div className="flex items-center gap-3">
        {user.image ? (
          <img src={user.image} alt={name} className="size-10 rounded-full object-cover" />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-surface2 text-sm font-bold text-[#9A9A9A]">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#F2F2F2]">{name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-[#9A9A9A]">
              <StarIcon className="size-3" /> {user.reputationScore} rep
            </span>
            {user.phoneVerified && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                <ShieldCheckIcon className="size-3" /> Verified
              </span>
            )}
          </div>
        </div>
      </div>
      {user.city && (
        <p className="mt-2 flex items-center gap-1 text-xs text-[#9A9A9A]">
          <MapPinIcon className="size-3.5" /> {user.city}
        </p>
      )}
    </div>
  );
}

// ── Message button ────────────────────────────────────────────────────────────

function MessageButton({ otherId, listingId }: { otherId: string; listingId: string }) {
  const [loading, setLoading] = useState(false);
  async function open() {
    setLoading(true);
    const res  = await fetch("/api/conversations", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ recipientId: otherId, listingId }),
    });
    const data = await res.json();
    if (res.ok) window.location.href = `/messages/${data.conversation.id}`;
    else setLoading(false);
  }
  return (
    <button
      onClick={open}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-50"
    >
      <ChatBubbleLeftEllipsisIcon className="size-4" />
      {loading ? "Opening…" : "Message"}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [txn, setTxn]       = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError]     = useState("");

  // Meetup form
  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const [meetLocation, setMeetLocation]     = useState("");
  const [meetDate, setMeetDate]             = useState("");

  // Cancel form
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason]     = useState("");

  // Dispute form
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason]     = useState("");

  // Rating
  const [myRating, setMyRating]           = useState<number | null>(null);
  const [ratingScore, setRatingScore]     = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingWorking, setRatingWorking] = useState(false);
  const [ratingError, setRatingError]     = useState("");
  const [ratingDone, setRatingDone]       = useState(false);

  const load = useCallback(async () => {
    const res  = await fetch(`/api/transactions/${id}`);
    const data = await res.json();
    if (res.ok) setTxn(data.transaction);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function action(payload: object) {
    setWorking(true);
    setError("");
    const res  = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Something went wrong");
    else await load();
    setWorking(false);
  }

  async function proposeMeetup() {
    if (!meetLocation.trim() || !meetDate) return;
    setWorking(true);
    setError("");
    const res  = await fetch(`/api/transactions/${id}/meetup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: meetLocation, proposedAt: new Date(meetDate).toISOString() }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Could not propose meetup");
    else {
      setShowMeetupForm(false);
      setMeetLocation("");
      setMeetDate("");
      await load();
    }
    setWorking(false);
  }

  async function respondMeetup(meetupId: string, status: "accepted" | "declined") {
    setWorking(true);
    setError("");
    const res = await fetch(`/api/transactions/${id}/meetup/${meetupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Could not respond");
    else await load();
    setWorking(false);
  }

  async function submitRating() {
    if (!ratingScore) return;
    setRatingWorking(true);
    setRatingError("");
    const res  = await fetch("/api/ratings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ transactionId: id, score: ratingScore, comment: ratingComment || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRatingError(data.error ?? "Could not submit rating");
    } else {
      setMyRating(ratingScore);
      setRatingDone(true);
    }
    setRatingWorking(false);
  }

  // ── Loading / not found ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      </div>
    );
  }
  if (!txn) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-[#9A9A9A]">Transaction not found.</p>
        <Link href="/transactions" className="mt-3 inline-block text-sm text-accent hover:underline">← Back to transactions</Link>
      </div>
    );
  }

  const isOnlineUnpaid = txn.method === "online" && !txn.paidAt && txn.status === "pending";
  const rawCfg    = STATUS_CONFIG[txn.status] ?? STATUS_CONFIG.pending;
  const cfg       = isOnlineUnpaid
    ? { ...rawCfg, label: "Awaiting online payment" }
    : rawCfg;
  const isBuyer   = txn.role === "buyer";
  const isSeller  = txn.role === "seller";
  const isActive  = ["pending", "agreed"].includes(txn.status);
  const acceptedMeetup = txn.meetups.find((m) => m.status === "accepted");

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:px-10">
      <Link href="/transactions" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#9A9A9A] hover:text-[#F2F2F2]">
        ← Transactions
      </Link>

      {/* Status banner */}
      <div className={`mb-4 rounded-2xl border p-4 ${cfg.bg}`}>
        <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
        {isOnlineUnpaid && isBuyer && (
          <p className="mt-1 text-xs text-[#9A9A9A]">Complete your payment to confirm the purchase.</p>
        )}
        {txn.status === "pending" && isBuyer && !isOnlineUnpaid && (
          <p className="mt-1 text-xs text-[#9A9A9A]">Waiting for the seller to confirm your request.</p>
        )}
        {txn.status === "agreed" && (
          <p className="mt-1 text-xs text-[#9A9A9A]">Arrange a safe meetup below. Meet in a public place, daytime, bring exact change.</p>
        )}
        {txn.cancelReason && (
          <p className="mt-1 text-xs text-[#9A9A9A]">Reason: {txn.cancelReason}</p>
        )}
      </div>

      {/* Payment badge */}
      <div className="mb-4">
        <PaymentBadge
          method={txn.method}
          paidAt={txn.paidAt}
          checkoutUrl={txn.paymongoCheckoutUrl}
          isBuyer={isBuyer}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Message counterparty */}
      <div className="mb-4">
        <MessageButton otherId={isBuyer ? txn.sellerId : txn.buyerId} listingId={txn.listingId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">

        {/* Card summary */}
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Listing</p>
          <div className="flex gap-3">
            {txn.card.imageUrl && (
              <img src={txn.card.imageUrl} alt={txn.card.name}
                className="size-14 rounded-lg object-contain" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F2F2F2]">{txn.card.name}</p>
              <p className="text-xs text-[#9A9A9A]">{txn.card.setName ?? "—"}</p>
              <p className="mt-1 text-lg font-bold text-[#F2F2F2]">{formatPHP(txn.agreedPrice)}</p>
              {txn.quantity > 1 && <p className="text-xs text-[#9A9A9A]">×{txn.quantity}</p>}
            </div>
          </div>
          {txn.buyerNote && (
            <p className="mt-3 rounded-lg bg-surface2 p-2 text-xs text-[#9A9A9A]">
              Note: {txn.buyerNote}
            </p>
          )}
          <Link
            href={`/listings/${txn.listingId}`}
            className="mt-2 block text-right text-[10px] text-accent hover:underline"
          >
            View listing →
          </Link>
        </div>

        {/* Counterparty */}
        <UserCard user={isBuyer ? txn.seller : txn.buyer} label={isBuyer ? "Seller" : "Buyer"} />

      </div>

      {/* Action buttons */}
      {isActive && (
        <div className="mt-4 flex flex-wrap gap-2">
          {/* Seller: confirm pending */}
          {isSeller && txn.status === "pending" && (
            <button
              onClick={() => action({ action: "confirm" })}
              disabled={working}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/80 disabled:opacity-50"
            >
              Confirm sale
            </button>
          )}

          {/* Agreed: propose meetup */}
          {txn.status === "agreed" && !showMeetupForm && (
            <button
              onClick={() => setShowMeetupForm(true)}
              className="rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-sm font-medium text-[#F2F2F2] transition hover:border-white/20"
            >
              Propose meetup
            </button>
          )}

          {/* Agreed: mark done */}
          {txn.status === "agreed" && (
            <button
              onClick={() => action({ action: "complete" })}
              disabled={working}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Mark completed
            </button>
          )}

          {/* Agreed: no-show */}
          {txn.status === "agreed" && (
            <button
              onClick={() => action({ action: "no_show" })}
              disabled={working}
              className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-sm font-medium text-orange-400 transition hover:bg-orange-500/20 disabled:opacity-50"
            >
              Report no-show
            </button>
          )}

          {/* Dispute */}
          {["agreed", "pending"].includes(txn.status) && !showDisputeForm && (
            <button
              onClick={() => { setShowDisputeForm(true); setShowCancelForm(false); }}
              className="rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:border-red-500/40 hover:bg-red-500/5"
            >
              File a dispute
            </button>
          )}

          {/* Cancel */}
          {!showCancelForm && !showDisputeForm && (
            <button
              onClick={() => setShowCancelForm(true)}
              className="ml-auto rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:text-[#F2F2F2]"
            >
              Cancel transaction
            </button>
          )}
        </div>
      )}

      {/* Dispute form */}
      {showDisputeForm && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-red-400">File a dispute</p>
          <p className="text-[11px] text-[#9A9A9A]">
            Describe the issue in detail. An admin will review and reach out to both parties within 24–48 hours.
            Misuse of disputes may result in account action.
          </p>
          <textarea
            placeholder="What went wrong? (min 10 characters)"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => action({ action: "dispute", disputeReason })}
              disabled={working || disputeReason.trim().length < 10}
              className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition"
            >
              {working ? "Submitting…" : "Submit dispute"}
            </button>
            <button
              onClick={() => { setShowDisputeForm(false); setDisputeReason(""); }}
              className="text-sm text-[#9A9A9A] hover:text-[#F2F2F2]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Meetup proposal form */}
      {showMeetupForm && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-surface p-4">
          <p className="mb-3 text-sm font-semibold text-[#F2F2F2]">Propose a meetup</p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Location (e.g. SM North EDSA Starbucks, G/F)"
              value={meetLocation}
              onChange={(e) => setMeetLocation(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
            />
            <input
              type="datetime-local"
              value={meetDate}
              onChange={(e) => setMeetDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] focus:border-white/20 focus:outline-none"
            />
            <p className="text-[11px] text-[#9A9A9A]">
              💡 Choose a public place (mall, McDonald&apos;s, coffee shop) during daytime hours.
            </p>
            <div className="flex gap-2">
              <button
                onClick={proposeMeetup}
                disabled={working || !meetLocation.trim() || !meetDate}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Send proposal
              </button>
              <button onClick={() => setShowMeetupForm(false)} className="text-sm text-[#9A9A9A] hover:text-[#F2F2F2]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel form */}
      {showCancelForm && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="mb-2 text-sm font-semibold text-red-400">Cancel this transaction?</p>
          <textarea
            placeholder="Reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            className="mb-3 w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => action({ action: "cancel", cancelReason: cancelReason || undefined })}
              disabled={working}
              className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/30 disabled:opacity-50"
            >
              Confirm cancel
            </button>
            <button onClick={() => setShowCancelForm(false)} className="text-sm text-[#9A9A9A] hover:text-[#F2F2F2]">
              Keep transaction
            </button>
          </div>
        </div>
      )}

      {/* Accepted meetup highlight */}
      {acceptedMeetup && txn.status === "agreed" && (
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
            <CheckCircleIcon className="size-4" /> Accepted meetup
          </p>
          <p className="flex items-center gap-1.5 text-sm text-[#F2F2F2]">
            <MapPinIcon className="size-4 shrink-0 text-[#9A9A9A]" /> {acceptedMeetup.location}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[#F2F2F2]">
            <CalendarIcon className="size-4 shrink-0 text-[#9A9A9A]" />
            {formatDateTime(acceptedMeetup.proposedAt)}
          </p>
          <p className="mt-3 rounded-lg bg-emerald-900/20 px-3 py-2 text-[11px] text-[#9A9A9A]">
            🛡️ Meet in a public place, daytime. Bring exact change. Inspect the card before handing over money.
          </p>
        </div>
      )}

      {/* Meetup proposals list */}
      {txn.meetups.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
            Meetup proposals
          </h2>
          <div className="space-y-3">
            {txn.meetups.map((m) => {
              const isProposer    = m.proposerId === (isBuyer ? txn.buyerId : txn.sellerId);
              const statusColor   = m.status === "accepted" ? "text-emerald-400" : m.status === "declined" ? "text-red-400" : "text-yellow-400";
              const statusLabel   = m.status === "accepted" ? "Accepted" : m.status === "declined" ? "Declined" : "Pending";
              const canRespond    = m.status === "pending" && !isProposer && isActive;

              return (
                <div key={m.id} className="rounded-xl border border-white/10 bg-surface2 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-sm text-[#F2F2F2]">
                        <MapPinIcon className="size-4 shrink-0 text-[#9A9A9A]" /> {m.location}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#9A9A9A]">
                        <CalendarIcon className="size-3.5" /> {formatDateTime(m.proposedAt)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#9A9A9A]">
                    Proposed by {isProposer ? "you" : (isBuyer ? txn.seller.displayName ?? txn.seller.name : txn.buyer.displayName ?? txn.buyer.name)}
                    {" · "}
                    {new Date(m.createdAt).toLocaleDateString("en-PH")}
                  </p>

                  {canRespond && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => respondMeetup(m.id, "accepted")}
                        disabled={working}
                        className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondMeetup(m.id, "declined")}
                        disabled={working}
                        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safe meetup note */}
      {isActive && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-[11px] text-[#9A9A9A]">
            <strong className="text-[#F2F2F2]">Safe meetup tips:</strong>{" "}
            Always meet in a public, well-lit place (mall food court, coffee shop, Jollibee).
            Prefer daytime. Bring a friend if possible. Inspect the card thoroughly before paying.
            Use exact change — never wire money or pay advance.
          </p>
        </div>
      )}

      {/* Rating section */}
      {txn.status === "completed" && (
        <div className="mt-6">
          {ratingDone || myRating !== null ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-400">
                {"★".repeat(ratingDone ? ratingScore : myRating ?? 0)}
                {"☆".repeat(5 - (ratingDone ? ratingScore : myRating ?? 0))}
              </p>
              <p className="mt-1 text-xs text-[#9A9A9A]">
                {ratingDone ? "Thanks for rating!" : "You've already rated this transaction."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-surface p-4">
              <p className="mb-3 text-sm font-semibold text-[#F2F2F2]">
                Rate your {isBuyer ? "seller" : "buyer"}
              </p>
              {/* Star picker */}
              <div className="mb-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRatingScore(s)}
                    className={`text-2xl transition ${s <= ratingScore ? "text-yellow-400" : "text-white/20 hover:text-yellow-400/60"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Leave a comment (optional)"
                rows={2}
                maxLength={500}
                className="mb-3 w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
              />
              {ratingError && <p className="mb-2 text-xs text-red-400">{ratingError}</p>}
              <button
                onClick={submitRating}
                disabled={!ratingScore || ratingWorking}
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-accent/80 transition"
              >
                {ratingWorking ? "Submitting…" : "Submit Rating"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

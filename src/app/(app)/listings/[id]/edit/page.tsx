"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function EditListingPage() {
  const router   = useRouter();
  const { id }   = useParams<{ id: string }>();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice]     = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus]   = useState<"active" | "paused">("active");
  const [saving, setSaving]   = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const l = d.listing;
        setListing(l);
        setPrice(parseFloat(l.price).toString());
        setDescription(l.description ?? "");
        setStatus(l.status === "paused" ? "paused" : "active");
      })
      .catch(() => toast.error("Failed to load listing"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: parseFloat(price), description, status }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to save"); return; }
    toast.success("Listing updated");
    router.push(`/listings/${id}`);
  }

  async function handleCancel() {
    if (!confirm("Cancel this listing? It will be removed from the marketplace.")) return;
    setCancelling(true);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    setCancelling(false);
    if (!res.ok) { toast.error("Failed to cancel"); return; }
    toast.success("Listing cancelled");
    router.push("/listings");
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!listing) return null;

  const inputCls = "w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none";

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10 lg:px-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">Edit Listing</h1>
        <p className="mt-1 text-sm text-[#9A9A9A]">{listing.card?.name}</p>
      </div>

      <div className="space-y-5">
        {/* Status */}
        <div>
          <label className="mb-2 block text-xs font-medium text-[#9A9A9A]">Status</label>
          <div className="flex gap-2">
            {(["active", "paused"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold capitalize transition ${status === s ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">Price (PHP)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9A9A9A]">₱</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={1} step={0.01}
              className={`${inputCls} pl-7`} />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            className={`${inputCls} resize-none`} />
        </div>

        {/* Save / Cancel actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-[#9A9A9A] transition hover:text-[#F2F2F2]">
            Back
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4">
          <p className="mb-3 text-sm font-semibold text-rose-400">Danger Zone</p>
          <button onClick={handleCancel} disabled={cancelling}
            className="flex items-center gap-2 rounded-xl border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-400 transition hover:bg-rose-400/10 disabled:opacity-50">
            <TrashIcon className="size-4" />
            {cancelling ? "Cancelling…" : "Cancel Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}

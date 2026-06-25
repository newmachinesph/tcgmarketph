"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircleIcon, ShieldCheckIcon, StarIcon, ClockIcon, IdentificationIcon } from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";
import { settingsProfileSchema, type SettingsProfileInput } from "@/lib/validations/auth";
import { Button, Field } from "@/components/ui";
import { AvatarUpload } from "@/components/AvatarUpload";
import { PhoneVerify } from "@/components/PhoneVerify";
import { GAMES, PH_CITIES, type GameId } from "@/lib/constants";

interface RatingEntry {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  rater: { id: string; name: string; displayName: string | null; image: string | null };
}

// ─── KYC Verification section ─────────────────────────────────────────────────

function KycSection({ initialStatus }: { initialStatus: string }) {
  const [status, setStatus]   = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function startVerification() {
    setLoading(true);
    const res  = await fetch("/api/kyc/start", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to start verification");
      return;
    }
    window.location.href = data.verificationUrl;
  }

  if (status === "verified") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-bid/20 bg-bid/10 px-4 py-3.5">
        <ShieldCheckIcon className="size-5 shrink-0 text-bid" />
        <div>
          <p className="text-sm font-semibold text-bid">Identity Verified</p>
          <p className="text-xs text-[#9A9A9A]">Your identity has been confirmed through Didit.</p>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3.5">
        <ClockIcon className="size-5 shrink-0 text-yellow-400" />
        <div>
          <p className="text-sm font-semibold text-yellow-400">Verification in Progress</p>
          <p className="text-xs text-[#9A9A9A]">Your documents are being reviewed — usually a few minutes. We&apos;ll notify you when done.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface2">
          <IdentificationIcon className="size-4 text-[#9A9A9A]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F2F2F2]">Identity Verification</p>
          <p className="mt-0.5 text-xs text-[#9A9A9A]">
            Verify your identity to earn a Verified badge and build buyer trust. Takes 1-2 minutes.
          </p>
        </div>
      </div>

      {status === "rejected" && (
        <p className="rounded-xl bg-accent/10 px-3 py-2 text-xs text-accent">
          Your previous verification was declined. You may try again below.
        </p>
      )}

      <button
        onClick={startVerification}
        disabled={loading}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
      >
        {loading ? "Starting…" : "Start Verification"}
      </button>
      <p className="text-center text-[10px] text-[#9A9A9A]">
        Powered by{" "}
        <span className="font-semibold">Didit</span> · Your data is processed securely
      </p>
    </div>
  );
}

export default function EditProfilePage() {
  const { data: session, isPending } = authClient.useSession();

  type ExtendedUser = NonNullable<typeof session>["user"] & {
    city?: string | null;
    bio?: string | null;
    phone?: string | null;
    phoneVerified?: boolean;
    games?: string | null;
    image?: string | null;
    reputationScore?: number;
    noShowCount?: number;
    kycStatus?: "none" | "pending" | "verified" | "rejected";
  };
  const user = session?.user as ExtendedUser | undefined;

  const [avatar, setAvatar]               = useState<string | null | undefined>(null);
  const [selectedGames, setSelectedGames] = useState<Set<GameId>>(new Set());
  const [bioLen, setBioLen]               = useState(0);

  const [ratings, setRatings]     = useState<RatingEntry[]>([]);
  const [avgScore, setAvgScore]   = useState<string | null>(null);
  const [ratingTotal, setRatingTotal] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<SettingsProfileInput>({
    resolver: zodResolver(settingsProfileSchema),
    defaultValues: { name: "", city: "", bio: "", phone: "", games: "" },
  });

  // Populate form once session resolves
  useEffect(() => {
    if (!user) return;
    reset({
      name:  user.name  ?? "",
      city:  user.city  ?? "",
      bio:   user.bio   ?? "",
      phone: user.phone ?? "",
      games: user.games ?? "",
    });
    setAvatar(user.image ?? null);
    setSelectedGames(new Set(
      (user.games ?? "").split(",").filter(Boolean) as GameId[]
    ));
    setBioLen((user.bio ?? "").length);

    // Load reputation stats
    fetch(`/api/ratings?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        setRatings(d.ratings ?? []);
        setAvgScore(d.avgScore ?? null);
        setRatingTotal(d.total ?? 0);
      })
      .catch(() => {});
  }, [user, reset]);

  function toggleGame(id: GameId) {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const onSubmit = async (data: SettingsProfileInput) => {
    const updates: Record<string, unknown> = {
      name:  data.name,
      city:  data.city,
      bio:   data.bio   || undefined,
      phone: data.phone || undefined,
      games: Array.from(selectedGames).join(",") || undefined,
    };
    if (avatar !== user?.image) updates.image = avatar ?? undefined;

    const { error } = await authClient.updateUser(
      updates as Parameters<typeof authClient.updateUser>[0]
    );

    if (error) {
      setError("root", { message: error.message ?? "Could not save. Please try again." });
    } else {
      toast.success("Profile updated.");
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10 lg:px-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">Edit Profile</h1>
        <p className="mt-1 text-sm text-[#9A9A9A]">
          This is how buyers and sellers see you on TCGMarket.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <AvatarUpload
            value={avatar}
            name={user?.name ?? ""}
            onChange={setAvatar}
            size="lg"
          />
          <div>
            <p className="text-sm font-semibold text-[#F2F2F2]">Profile photo</p>
            <p className="mt-0.5 text-xs text-[#9A9A9A]">
              JPG, PNG or WebP · Max 5 MB · Cropped to square
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-6 space-y-5">

          {/* Name */}
          <Field label="Display Name" htmlFor="name" error={errors.name?.message}>
            <input
              {...register("name")}
              id="name"
              type="text"
              placeholder="Ash Ketchum"
              autoComplete="name"
              className="w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
              aria-invalid={!!errors.name}
            />
          </Field>

          {/* What do you collect? */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#9A9A9A]">What do you collect?</p>
            <div className="flex gap-3">
              {GAMES.map((game) => {
                const active = selectedGames.has(game.id);
                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => toggleGame(game.id)}
                    className={[
                      "flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all",
                      active
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-white/10 bg-surface2 text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {game.icon} {game.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* City */}
          <Field label="City" htmlFor="city" error={errors.city?.message}>
            <select
              {...register("city")}
              id="city"
              className="w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
              aria-invalid={!!errors.city}
            >
              <option value="" disabled>Select your city…</option>
              {PH_CITIES.map((group) => (
                <optgroup key={group.region} label={group.region}>
                  {group.cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          {/* Bio */}
          <Field label="Bio" htmlFor="bio" error={errors.bio?.message}
            hint={<span className="text-[10px] text-[#9A9A9A]">{bioLen}/160</span>}>
            <textarea
              {...register("bio", { onChange: (e) => setBioLen(e.target.value.length) })}
              id="bio"
              rows={2}
              maxLength={160}
              placeholder="e.g. Pokémon alt art collector based in Cebu."
              className="w-full resize-none rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
            />
          </Field>

          {/* Phone */}
          <Field
            label="Mobile Number"
            htmlFor="phone"
            error={errors.phone?.message}
            hint={<span className="text-[10px] text-[#9A9A9A]">PH numbers only</span>}
          >
            <input
              {...register("phone")}
              id="phone"
              type="tel"
              placeholder="09XXXXXXXXX"
              autoComplete="tel"
              className="w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
              aria-invalid={!!errors.phone}
            />
          </Field>
        </div>

        {/* Phone verification */}
        <PhoneVerify
          phone={user?.phone}
          phoneVerified={!!user?.phoneVerified}
          onVerified={() => window.location.reload()}
        />

        {errors.root && (
          <p role="alert" className="rounded-lg border border-ask/20 bg-ask/10 px-3 py-2 text-xs text-ask">
            {errors.root.message}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" size="md" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isSubmitSuccessful ? (
              <><CheckCircleIcon className="size-4" /> Saved</>
            ) : "Save Changes"}
          </Button>
          <a href="/dashboard" className="text-sm text-[#9A9A9A] hover:text-[#F2F2F2] transition-colors">
            Cancel
          </a>
        </div>

      </form>

      {/* ── KYC Verification ─────────────────────────────────────── */}
      <div className="mt-6 space-y-3">
        {typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("kyc") === "done" && (
          <div className="flex items-center gap-3 rounded-xl border border-bid/20 bg-bid/10 px-4 py-3 text-sm text-bid">
            <CheckCircleIcon className="size-4 shrink-0" />
            Verification submitted — we&apos;ll notify you once it&apos;s reviewed.
          </div>
        )}
        <KycSection initialStatus={user?.kycStatus ?? "none"} />
      </div>

      {/* ── Reputation ─────────────────────────────────────────────── */}
      <div className="mt-10 space-y-4">
        <h2 className="text-lg font-bold text-[#F2F2F2]">Your Reputation</h2>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-[#F2F2F2]">{user?.reputationScore ?? 0}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Completed Deals</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-[#F2F2F2]">
              {avgScore ? `${avgScore}★` : "—"}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Avg Rating ({ratingTotal})</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-surface p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              {user?.phoneVerified ? (
                <ShieldCheckIcon className="size-5 text-emerald-400" />
              ) : (
                <span className="text-2xl text-[#9A9A9A]">—</span>
              )}
            </div>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
              {user?.phoneVerified ? "Verified" : "Not Verified"}
            </p>
          </div>
        </div>

        {user?.noShowCount ? (
          <p className="rounded-xl bg-orange-500/10 px-3 py-2 text-xs text-orange-400">
            ⚠️ {user.noShowCount} no-show report{user.noShowCount !== 1 ? "s" : ""} on record.
          </p>
        ) : null}

        {/* Ratings list */}
        {ratings.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Received ratings</p>
            {ratings.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-surface p-4">
                <div className="flex items-start gap-3">
                  {r.rater.image ? (
                    <img src={r.rater.image} alt={r.rater.name} className="size-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="flex size-8 items-center justify-center rounded-full bg-surface2 text-xs font-bold text-[#9A9A9A] shrink-0">
                      {(r.rater.displayName ?? r.rater.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#F2F2F2]">{r.rater.displayName ?? r.rater.name}</p>
                      <span className="shrink-0 text-sm text-yellow-400">{"★".repeat(r.score)}{"☆".repeat(5 - r.score)}</span>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-xs text-[#9A9A9A]">{r.comment}</p>
                    )}
                    <p className="mt-1 text-[10px] text-[#9A9A9A]">
                      {new Date(r.createdAt).toLocaleDateString("en-PH")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#9A9A9A]">No ratings received yet. Complete a transaction to get your first rating.</p>
        )}
      </div>
    </div>
  );
}

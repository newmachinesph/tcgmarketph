"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { profileSetupSchema, type ProfileSetupInput } from "@/lib/validations/auth";
import { Button, Field } from "@/components/ui";

// ─── Constants ────────────────────────────────────────────────────────────────

const GAMES = [
  { id: "pokemon",   label: "Pokémon",   icon: "⚡" },
  { id: "one_piece", label: "One Piece", icon: "☠️" },
] as const;

type GameId = typeof GAMES[number]["id"];

const PH_CITIES: { region: string; cities: string[] }[] = [
  {
    region: "Metro Manila (NCR)",
    cities: [
      "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Manila",
      "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig",
      "Quezon City", "San Juan", "Taguig", "Valenzuela",
    ],
  },
  {
    region: "Near NCR / Rizal / Laguna / Cavite",
    cities: [
      "Antipolo", "Bacoor", "Biñan", "Calamba", "Imus", "Meycauayan",
      "San Jose del Monte", "Santa Rosa",
    ],
  },
  {
    region: "Central Luzon",
    cities: [
      "Angeles City", "Malolos", "Olongapo", "San Fernando (Pampanga)",
      "San Fernando (La Union)", "Tarlac City",
    ],
  },
  {
    region: "CALABARZON",
    cities: ["Batangas City", "Cabanatuan", "Lipa", "Lucena", "Naga"],
  },
  {
    region: "Ilocos / CAR",
    cities: ["Baguio", "Dagupan", "Laoag", "Vigan"],
  },
  {
    region: "Visayas",
    cities: ["Bacolod", "Cebu City", "Iloilo City", "Mandaue", "Ormoc", "Tacloban"],
  },
  {
    region: "Mindanao",
    cities: [
      "Cagayan de Oro", "Davao City", "General Santos",
      "Iligan", "Koronadal", "Zamboanga City",
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileSetupPage() {
  const { data: session, isPending } = authClient.useSession();
  const [selectedGames, setSelectedGames] = useState<Set<GameId>>(new Set());
  const [bioLen, setBioLen] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: { city: "", bio: "", phone: "", games: "" },
  });

  function toggleGame(id: GameId) {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const onSubmit = async (data: ProfileSetupInput) => {
    const gamesValue = Array.from(selectedGames).join(",");

    const { error } = await authClient.updateUser({
      city: data.city,
      bio: data.bio || undefined,
      phone: data.phone || undefined,
      games: gamesValue || undefined,
    } as Parameters<typeof authClient.updateUser>[0]);

    if (error) {
      setError("root", {
        message: error.message ?? "Could not save profile. Please try again.",
      });
    } else {
      toast.success("Profile saved!");
      window.location.href = "/dashboard";
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const userName = session?.user?.name ?? "";
  const initials = userName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[
            { label: "Account", done: true },
            { label: "Profile",  active: true },
            { label: "Verify",   done: false },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className={[
                "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                step.done    ? "bg-bid/20 text-bid" :
                step.active  ? "bg-accent text-white" :
                               "border border-white/10 bg-surface text-[#9A9A9A]",
              ].join(" ")}>
                {step.done ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium ${step.active ? "text-[#F2F2F2]" : "text-[#9A9A9A]"}`}>
                {step.label}
              </span>
              {i < 2 && <div className="h-px w-6 bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-8 shadow-2xl shadow-black/40">

          {/* Avatar + greeting */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 text-lg font-bold text-[#F2F2F2]">
              {initials || "?"}
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#F2F2F2]">
                Hey {userName.split(" ")[0] || "there"}! 👋
              </h1>
              <p className="text-sm text-[#9A9A9A]">
                Tell us a little about yourself so buyers and sellers know who they&apos;re dealing with.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* Games */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#9A9A9A]">Games you collect</p>
              <div className="flex gap-3">
                {GAMES.map((game) => {
                  const active = selectedGames.has(game.id);
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => toggleGame(game.id)}
                      className={[
                        "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all",
                        active
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-white/10 bg-surface2 text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]",
                      ].join(" ")}
                      aria-pressed={active}
                    >
                      <span>{game.icon}</span>
                      {game.label}
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
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 aria-[invalid=true]:border-ask/50"
                aria-invalid={!!errors.city}
                defaultValue=""
              >
                <option value="" disabled className="text-[#9A9A9A]">
                  Select your city…
                </option>
                {PH_CITIES.map((group) => (
                  <optgroup key={group.region} label={group.region}>
                    {group.cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>

            {/* Bio */}
            <Field label="Bio" htmlFor="bio" error={errors.bio?.message}
              hint={<span className="text-[10px] text-[#9A9A9A]">{bioLen}/160</span>}>
              <textarea
                {...register("bio", {
                  onChange: (e) => setBioLen(e.target.value.length),
                })}
                id="bio"
                rows={2}
                maxLength={160}
                placeholder="e.g. Pokémon alt art collector based in Cebu. Always looking for Umbreon VMAX."
                className="w-full resize-none rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
                aria-invalid={!!errors.bio}
              />
            </Field>

            {/* Phone */}
            <Field
              label="Mobile Number"
              htmlFor="phone"
              error={errors.phone?.message}
              hint={
                <span className="flex items-center gap-1 text-[10px] text-[#9A9A9A]">
                  <span className="rounded bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-yellow-400">
                    Verify later
                  </span>
                  PH numbers only
                </span>
              }
            >
              <input
                {...register("phone")}
                id="phone"
                type="tel"
                placeholder="09XXXXXXXXX"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 aria-[invalid=true]:border-ask/50"
              />
            </Field>

            {errors.root && (
              <p role="alert" className="rounded-lg border border-ask/20 bg-ask/10 px-3 py-2 text-xs text-ask">
                {errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              size="md"
              className="w-full justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : "Save & Go to Dashboard"}
            </Button>

          </form>

          <p className="mt-4 text-center text-xs text-[#9A9A9A]">
            All fields except City can be updated anytime in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}

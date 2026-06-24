"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";
import { settingsProfileSchema, type SettingsProfileInput } from "@/lib/validations/auth";
import { Button, Field } from "@/components/ui";
import { AvatarUpload } from "@/components/AvatarUpload";

// ─── Shared constants (duplicated from profile-setup — keep in sync) ──────────

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

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();

  type ExtendedUser = NonNullable<typeof session>["user"] & {
    city?: string | null;
    bio?: string | null;
    phone?: string | null;
    games?: string | null;
    image?: string | null;
  };
  const user = session?.user as ExtendedUser | undefined;

  const initialGames = new Set<GameId>(
    (user?.games ?? "").split(",").filter(Boolean) as GameId[]
  );

  const [avatar, setAvatar]           = useState<string | null | undefined>(user?.image);
  const [selectedGames, setSelectedGames] = useState<Set<GameId>>(initialGames);
  const [bioLen, setBioLen]           = useState((user?.bio ?? "").length);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<SettingsProfileInput>({
    resolver: zodResolver(settingsProfileSchema),
    defaultValues: {
      name:  user?.name  ?? "",
      city:  user?.city  ?? "",
      bio:   user?.bio   ?? "",
      phone: user?.phone ?? "",
      games: user?.games ?? "",
    },
  });

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
      bio:   data.bio  || undefined,
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
        <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">Profile Settings</h1>
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
            hint={
              <span className="flex items-center gap-1 text-[10px] text-[#9A9A9A]">
                <span className="rounded bg-yellow-400/10 px-1.5 py-0.5 font-bold uppercase text-yellow-400">
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
              className="w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
              aria-invalid={!!errors.phone}
            />
          </Field>
        </div>

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
    </div>
  );
}

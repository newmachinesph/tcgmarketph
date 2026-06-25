import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, listingPhotos } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { getTierLimits } from "@/lib/constants/tiers";
import { CONDITION_LABEL } from "@/lib/validations/listing";
import {
  PlusIcon,
  PencilSquareIcon,
  EyeIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

const STATUS_STYLE: Record<string, string> = {
  active:    "bg-emerald-400/10 text-emerald-400",
  paused:    "bg-yellow-400/10 text-yellow-400",
  sold:      "bg-sky-400/10 text-sky-400",
  cancelled: "bg-rose-400/10 text-rose-400",
  expired:   "bg-white/10 text-[#9A9A9A]",
};

export default async function MyListingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const u = session.user;
  const tier = u.subscriptionTier ?? "free";
  const limits = getTierLimits(tier);

  const rows = await db
    .select({ listing: listings, card: cardCatalog })
    .from(listings)
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .where(eq(listings.sellerId, u.id))
    .orderBy(listings.createdAt);

  // Fetch cover photo for each listing (order = 0)
  const listingIds = rows.map((r) => r.listing.id);
  const covers = listingIds.length
    ? await db
        .selectDistinctOn([listingPhotos.listingId], { listingId: listingPhotos.listingId, url: listingPhotos.url })
        .from(listingPhotos)
        .where(eq(listingPhotos.order, 0))
    : [];
  const coverByListing = Object.fromEntries(covers.map((c) => [c.listingId, c.url]));

  const activeCount = rows.filter((r) => r.listing.status === "active").length;
  const canCreate = u.phoneVerified;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-10">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">My Listings</h1>
          <p className="mt-1 text-sm text-[#9A9A9A]">
            {activeCount} active · limit {limits.maxActiveListings} ({tier === "power_seller" ? "Power Seller" : "Free"})
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/listings/new"
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            <PlusIcon className="size-4" /> New Listing
          </Link>
        ) : (
          <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2.5 text-xs text-yellow-400">
            Verify your phone to start selling
          </div>
        )}
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface py-24 text-center">
          <TagIcon className="mb-3 size-10 text-white/20" />
          <p className="font-semibold text-[#F2F2F2]">No listings yet</p>
          <p className="mt-1 text-sm text-[#9A9A9A]">
            {canCreate ? "Create your first listing to start selling." : "Verify your phone number to start selling cards."}
          </p>
          {canCreate && (
            <Link href="/listings/new" className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition">
              Create listing
            </Link>
          )}
        </div>
      )}

      {/* Listing rows */}
      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map(({ listing, card }) => (
            <div key={listing.id}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface p-4 transition hover:border-white/20">

              {/* Cover photo or placeholder */}
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-surface2">
                {coverByListing[listing.id] ? (
                  <Image src={coverByListing[listing.id]} alt={card.name} fill sizes="48px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/20">
                    <TagIcon className="size-5" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-[#F2F2F2]">{card.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[listing.status] ?? ""}`}>
                    {listing.status}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[#9A9A9A]">
                  {card.setName} ·{" "}
                  {listing.isGraded
                    ? `${listing.gradingCompany?.toUpperCase()} ${listing.gradeValue}`
                    : CONDITION_LABEL[listing.condition]}
                </p>
                <p className="mt-1 text-sm font-bold text-[#F2F2F2]">
                  ₱{parseFloat(listing.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/listings/${listing.id}`}
                  className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
                  aria-label="View listing">
                  <EyeIcon className="size-4" />
                </Link>
                {["active", "paused"].includes(listing.status) && (
                  <Link href={`/listings/${listing.id}/edit`}
                    className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
                    aria-label="Edit listing">
                    <PencilSquareIcon className="size-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

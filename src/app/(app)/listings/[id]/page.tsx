import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { CONDITION_LABEL } from "@/lib/validations/listing";
import { GAME_LABEL } from "@/lib/constants/games";
import { Price } from "@/components/Price";
import { ListingGallery } from "./ListingGallery";
import { BuyNowButton } from "./BuyNowButton";
import { MakeOfferButton } from "./MakeOfferButton";
import { MessageSellerButton } from "./MessageSellerButton";
import { AuctionPanel } from "./AuctionPanel";
import { ReportButton } from "@/components/ReportButton";
import { PriceAlertButton } from "@/components/PriceAlertButton";
import {
  MapPinIcon,
  StarIcon,
  ShieldCheckIcon,
  TagIcon,
  PencilSquareIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

type Params = { params: Promise<{ id: string }> };

async function getListing(id: string) {
  const res = await fetch(
    `${process.env.BETTER_AUTH_URL}/api/listings/${id}`,
    { cache: "no-store" }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load listing");
  return res.json().then((d) => d.listing);
}

export default async function ListingDetailPage({ params }: Params) {
  const { id } = await params;
  const [session, listing] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getListing(id),
  ]);

  if (!listing) notFound();

  const isOwner = session?.user.id === listing.sellerId;
  const isActive = listing.status === "active";

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / 86_400_000)
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

        {/* Left — photos + description */}
        <div className="space-y-6">
          <ListingGallery photos={listing.photos} cardName={listing.card.name} />

          {listing.description && (
            <div className="rounded-2xl border border-white/10 bg-surface p-5">
              <h2 className="mb-2 text-sm font-semibold text-[#F2F2F2]">Description</h2>
              <p className="whitespace-pre-wrap text-sm text-[#9A9A9A]">{listing.description}</p>
            </div>
          )}

          {/* Card details */}
          <div className="rounded-2xl border border-white/10 bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#F2F2F2]">Card Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {[
                ["Game",      GAME_LABEL[listing.card.game] ?? listing.card.game],
                ["Set",       listing.card.setName ?? "—"],
                ["Number",    listing.card.cardNumber ?? "—"],
                ["Rarity",    listing.card.rarity ?? "—"],
                ["Condition", listing.isGraded
                  ? `${listing.gradingCompany?.toUpperCase()} ${listing.gradeValue}`
                  : CONDITION_LABEL[listing.condition] ?? listing.condition],
                ["Foil",      listing.isFoil ? "Yes" : "No"],
                ["1st Ed.",   listing.isFirstEdition ? "Yes" : "No"],
                ["Quantity",  listing.quantity],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-[#9A9A9A]">{label}</dt>
                  <dd className="font-medium text-[#F2F2F2]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Right — price + seller + actions */}
        <div className="space-y-4">

          {/* Title + status */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-bold text-[#F2F2F2]">{listing.card.name}</h1>
              {!isActive && (
                <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase text-[#9A9A9A]">
                  {listing.status}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-[#9A9A9A]">{listing.card.setName}</p>
          </div>

          {/* Price */}
          <div className="rounded-2xl border border-white/10 bg-surface p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Price</p>
            <p className="mt-1 text-3xl font-bold text-[#F2F2F2]">
              ₱{parseFloat(listing.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
            {listing.card.marketPrice && (
              <p className="mt-0.5 text-xs text-[#9A9A9A]">
                Market ref: <Price usd={parseFloat(listing.card.marketPrice)} />
              </p>
            )}
          </div>

          {/* Expiry notice */}
          {isActive && (
            <div className="flex items-center gap-1.5 text-xs text-[#9A9A9A]">
              <ClockIcon className="size-3.5" />
              Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
            </div>
          )}

          {/* Action buttons */}
          {isOwner ? (
            <div className="flex gap-2">
              <Link href={`/listings/${listing.id}/edit`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]">
                <PencilSquareIcon className="size-4" /> Edit Listing
              </Link>
            </div>
          ) : listing.type === "auction" ? (
            <AuctionPanel
              listingId={listing.id}
              startingPrice={listing.startingPrice ?? listing.price}
              currentBid={listing.currentBid}
              bidIncrement={listing.bidIncrement}
              reservePrice={listing.reservePrice}
              auctionEnd={listing.auctionEnd ?? listing.expiresAt}
              isOwner={isOwner}
              isActive={isActive}
            />
          ) : isActive ? (
            <div className="space-y-2">
              <BuyNowButton
                listingId={listing.id}
                maxQty={listing.quantity}
                price={listing.price}
                cardName={listing.card.name}
              />
              <MakeOfferButton
                listingId={listing.id}
                listingPrice={listing.price}
                cardName={listing.card.name}
              />
              <MessageSellerButton
                sellerId={listing.sellerId}
                listingId={listing.id}
              />
              {session && (
                <PriceAlertButton
                  listingId={listing.id}
                  currentPrice={listing.price}
                />
              )}
            </div>
          ) : (
            <p className="text-center text-sm text-[#9A9A9A]">This listing is no longer available.</p>
          )}

          {/* Seller card */}
          <div className="rounded-2xl border border-white/10 bg-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Seller</p>
            <div className="flex items-center gap-3">
              {listing.seller.image ? (
                <img src={listing.seller.image} alt={listing.seller.name}
                  className="size-10 rounded-full object-cover" />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-surface2 text-sm font-bold text-[#9A9A9A]">
                  {(listing.seller.displayName ?? listing.seller.name).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <Link href={`/sellers/${listing.sellerId}`} className="text-sm font-semibold text-[#F2F2F2] hover:underline">
                  {listing.seller.displayName ?? listing.seller.name}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  {listing.seller.avgRating ? (
                    <span className="flex items-center gap-1 text-xs text-yellow-400">
                      <StarIcon className="size-3" />
                      {listing.seller.avgRating}
                      <span className="text-[#9A9A9A]">({listing.seller.ratingCount})</span>
                    </span>
                  ) : (
                    <span className="text-xs text-[#9A9A9A]">{listing.seller.reputationScore ?? 0} deals</span>
                  )}
                  {listing.seller.phoneVerified && (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                      <ShieldCheckIcon className="size-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            {listing.seller.city && (
              <p className="mt-3 flex items-center gap-1 text-xs text-[#9A9A9A]">
                <MapPinIcon className="size-3.5" /> {listing.seller.city}
              </p>
            )}
            <p className="mt-3 rounded-lg bg-surface2 px-3 py-2 text-[10px] text-[#9A9A9A]">
              💡 Cash on meetup — meet in a public place, daytime, bring exact change.
            </p>
            {!isOwner && (
              <div className="mt-3 flex justify-end">
                <ReportButton targetType="listing" targetId={listing.id} />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

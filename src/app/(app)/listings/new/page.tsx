import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { userCollection } from "@/db/schema/cards";
import { cardCatalog } from "@/db/schema/cards";
import { getTierLimits } from "@/lib/constants/tiers";
import { CreateListingForm } from "./CreateListingForm";

interface Props {
  searchParams: Promise<{ fromCollection?: string }>;
}

export default async function NewListingPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  if (!session.user.phoneVerified) redirect("/profile?verify=phone");

  const { fromCollection } = await searchParams;

  // Pre-fill from a collection entry if provided
  let prefill: {
    cardId: string;
    cardName: string;
    cardSet: string | null;
    cardImage: string | null;
    condition: string;
    isGraded: boolean;
    gradingCompany: string;
    gradeValue: string | null;
    isFoil: boolean;
    isFirstEdition: boolean;
    sourceCollectionId: string;
  } | null = null;

  if (fromCollection) {
    const [row] = await db
      .select({ entry: userCollection, card: cardCatalog })
      .from(userCollection)
      .innerJoin(cardCatalog, eq(userCollection.cardId, cardCatalog.id))
      .where(eq(userCollection.id, fromCollection))
      .limit(1);

    // Only allow if the entry belongs to this user
    if (row && row.entry.userId === session.user.id) {
      prefill = {
        cardId:             row.card.id,
        cardName:           row.card.name,
        cardSet:            row.card.setName,
        cardImage:          row.card.imageUrl,
        condition:          row.entry.condition,
        isGraded:           row.entry.gradingCompany !== "none",
        gradingCompany:     row.entry.gradingCompany,
        gradeValue:         row.entry.gradeValue,
        isFoil:             row.entry.isFoil,
        isFirstEdition:     row.entry.isFirstEdition,
        sourceCollectionId: row.entry.id,
      };
    }
  }

  const tier = session.user.subscriptionTier ?? "free";
  const limits = getTierLimits(tier);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10 lg:px-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">
          {prefill ? "List Card for Sale" : "New Listing"}
        </h1>
        <p className="mt-1 text-sm text-[#9A9A9A]">
          Your card will be listed for 30 days · up to {limits.maxPhotosPerListing} photos
        </p>
      </div>
      <CreateListingForm prefill={prefill} maxPhotos={limits.maxPhotosPerListing} />
    </div>
  );
}

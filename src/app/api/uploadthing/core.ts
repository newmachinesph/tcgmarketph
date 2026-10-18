import { createUploadthing, type FileRouter } from "uploadthing/next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getTierLimits } from "@/lib/constants/tiers";

const f = createUploadthing();

export const listingPhotoRouter = {
  listingPhoto: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 10, // enforced down to 3 for free tier in UI + API
    },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session) throw new Error("Unauthorized");
      if (!session.user.phoneVerified) throw new Error("Phone verification required to upload listing photos");

      const tier = session.user.subscriptionTier ?? "free";
      const limits = getTierLimits(tier);

      return { userId: session.user.id, maxPhotos: limits.maxPhotosPerListing };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type ListingPhotoRouter = typeof listingPhotoRouter;

import { generateReactHelpers } from "@uploadthing/react";
import type { ListingPhotoRouter } from "@/app/api/uploadthing/core";

export const { useUploadThing, uploadFiles } = generateReactHelpers<ListingPhotoRouter>();

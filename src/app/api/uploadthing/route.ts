import { createRouteHandler } from "uploadthing/next";
import { listingPhotoRouter } from "./core";

export const { GET, POST } = createRouteHandler({ router: listingPhotoRouter });

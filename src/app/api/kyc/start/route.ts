import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, kycVerification } from "@/db/schema/auth";

const DIDIT_API    = "https://verification.didit.me/v3/session/";
const WORKFLOW_ID  = "4d1c8c29-9c61-44c1-9aba-d72614a80518";
const BASE_URL     = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Block if already verified or pending
  const currentStatus = (session.user as { kycStatus?: string }).kycStatus;
  if (currentStatus === "verified") {
    return NextResponse.json({ error: "Already verified" }, { status: 409 });
  }

  if (!process.env.DIDIT_API_KEY) {
    return NextResponse.json({ error: "KYC not configured" }, { status: 503 });
  }

  // Create Didit session
  const diditRes = await fetch(DIDIT_API, {
    method: "POST",
    headers: {
      "x-api-key":    process.env.DIDIT_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id:     WORKFLOW_ID,
      callback:        `${BASE_URL}/profile?kyc=done`,
      callback_method: "both",
      vendor_data:     userId,
    }),
  });

  if (!diditRes.ok) {
    const text = await diditRes.text();
    console.error("[kyc/start] Didit API error:", diditRes.status, text);
    return NextResponse.json({ error: "Failed to create verification session" }, { status: 502 });
  }

  const data = await diditRes.json();
  const { session_id: diditSessionId, verification_url: verificationUrl } = data;

  if (!diditSessionId || !verificationUrl) {
    console.error("[kyc/start] Unexpected Didit response:", data);
    return NextResponse.json({ error: "Invalid response from Didit" }, { status: 502 });
  }

  // Update existing record or insert new one
  const [existing] = await db
    .select({ id: kycVerification.id })
    .from(kycVerification)
    .where(eq(kycVerification.userId, userId));

  if (existing) {
    await db
      .update(kycVerification)
      .set({ diditSessionId, status: "pending" })
      .where(eq(kycVerification.id, existing.id));
  } else {
    await db
      .insert(kycVerification)
      .values({ userId, diditSessionId, status: "pending" });
  }

  // Mark user as pending
  await db
    .update(userTable)
    .set({ kycStatus: "pending" })
    .where(eq(userTable.id, userId));

  return NextResponse.json({ verificationUrl });
}

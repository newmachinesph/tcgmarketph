import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable, kycVerification } from "@/db/schema/auth";
import { createNotification } from "@/lib/notify";

// Didit status → our kycStatus mapping
const STATUS_MAP: Record<string, "pending" | "verified" | "rejected" | "none"> = {
  "Approved":    "verified",
  "Declined":    "rejected",
  "In Review":   "pending",
  "Expired":     "none",
  "Abandoned":   "none",
  "KYC Expired": "none",
  "Not Started": "none",
  "In Progress": "pending",
};

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const expBuf   = Buffer.from(expected);
    const sigBuf   = Buffer.from(signature);
    if (expBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(expBuf, sigBuf);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody  = await request.text();
  const sig      = request.headers.get("x-signature") ?? request.headers.get("x-signatur") ?? "";
  const secret   = process.env.DIDIT_WEBHOOK_SECRET ?? "";

  if (!secret) {
    console.error("[webhook/didit] DIDIT_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!verifySignature(rawBody, sig, secret)) {
    console.warn("[webhook/didit] Invalid signature — possible spoofed request");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const diditSessionId = payload["session_id"] as string | undefined;
  const diditStatus    = payload["status"]     as string | undefined;

  if (!diditSessionId || !diditStatus) {
    return NextResponse.json({ error: "Missing session_id or status" }, { status: 400 });
  }

  const newKycStatus = STATUS_MAP[diditStatus];
  if (!newKycStatus) {
    // Unknown status — acknowledge but do nothing
    return NextResponse.json({ ok: true });
  }

  // Look up the kycVerification record by diditSessionId
  const [kycRecord] = await db
    .select({ id: kycVerification.id, userId: kycVerification.userId })
    .from(kycVerification)
    .where(eq(kycVerification.diditSessionId, diditSessionId));

  if (!kycRecord) {
    console.warn("[webhook/didit] Unknown session_id:", diditSessionId);
    return NextResponse.json({ ok: true }); // Acknowledge to avoid retries
  }

  const rejectionReason =
    newKycStatus === "rejected"
      ? (payload["decision"] as Record<string, unknown> | undefined)?.["reason"] as string | undefined ?? diditStatus
      : null;

  // Update kycVerification record
  await db
    .update(kycVerification)
    .set({
      status:          newKycStatus === "none" ? "pending" : newKycStatus,
      rejectionReason: rejectionReason ?? null,
      rawPayload:      rawBody,
    })
    .where(eq(kycVerification.id, kycRecord.id));

  // Update user kycStatus
  const userStatus = newKycStatus === "none" ? "none" : newKycStatus;
  await db
    .update(userTable)
    .set({ kycStatus: userStatus })
    .where(eq(userTable.id, kycRecord.userId));

  // Send in-app notification
  const notifMsg =
    newKycStatus === "verified" ? "Your identity has been verified successfully." :
    newKycStatus === "rejected" ? `Your KYC verification was declined. ${rejectionReason ?? ""}`.trim() :
    "Your KYC verification status has been updated.";

  createNotification(
    kycRecord.userId,
    "system",
    newKycStatus === "verified" ? "Identity Verified" :
    newKycStatus === "rejected" ? "KYC Declined"      : "KYC Update",
    notifMsg,
    "/profile",
  ).catch(console.error);

  console.log(`[webhook/didit] Session ${diditSessionId} → ${diditStatus} (user ${kycRecord.userId})`);
  return NextResponse.json({ ok: true });
}

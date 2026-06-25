import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { kycVerification } from "@/db/schema/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [record] = await db
    .select({
      status:          kycVerification.status,
      rejectionReason: kycVerification.rejectionReason,
      updatedAt:       kycVerification.updatedAt,
    })
    .from(kycVerification)
    .where(eq(kycVerification.userId, session.user.id))
    .orderBy(kycVerification.createdAt)
    .limit(1);

  return NextResponse.json({
    kycStatus: (session.user as { kycStatus?: string }).kycStatus ?? "none",
    record: record ?? null,
  });
}

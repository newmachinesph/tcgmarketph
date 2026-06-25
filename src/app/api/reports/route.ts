import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports } from "@/db/schema/reports";

const schema = z.object({
  targetType: z.enum(["user", "listing", "message"]),
  targetId:   z.string().min(1),
  reason:     z.string().min(1).max(100),
  details:    z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { targetType, targetId, reason, details } = parsed.data;

  const [report] = await db
    .insert(reports)
    .values({
      reporterId: session.user.id,
      targetType,
      targetId,
      reason,
      details: details ?? null,
    })
    .returning();

  return NextResponse.json({ report }, { status: 201 });
}

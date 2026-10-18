import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports, adminActions } from "@/db/schema/reports";

const schema = z.object({
  status: z.enum(["reviewing", "resolved", "dismissed"]),
  note:   z.string().max(500).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { status, note } = parsed.data;

  const [report] = await db
    .update(reports)
    .set({
      status,
      resolvedBy: status === "reviewing" ? null : session.user.id,
      resolvedAt: status === "reviewing" ? null : new Date(),
    })
    .where(eq(reports.id, id))
    .returning();

  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.insert(adminActions).values({
    adminId:    session.user.id,
    actionType: status === "resolved" ? "resolve_report" : "dismiss_report",
    targetType: "report",
    targetId:   id,
    note:       note ?? null,
  });

  return NextResponse.json({ report });
}

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAllFlags, setFlag, type FeatureFlagKey } from "@/lib/feature-flags";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const flags = await getAllFlags();
  return NextResponse.json(flags);
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.key !== "string" || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "Invalid body — expected { key, enabled }" }, { status: 400 });
  }

  const validKeys: FeatureFlagKey[] = ["online_payments"];
  if (!validKeys.includes(body.key as FeatureFlagKey)) {
    return NextResponse.json({ error: "Unknown flag key" }, { status: 400 });
  }

  await setFlag(body.key as FeatureFlagKey, body.enabled);
  return NextResponse.json({ ok: true, [body.key]: body.enabled });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

const MAX_ATTEMPTS = 5;

interface OtpRecord {
  code: string;
  phone: string;
  attempts: number;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) return NextResponse.json({ error: "Code is required." }, { status: 400 });

  const key = `otp:${session.user.id}`;
  const raw = await redis.get<OtpRecord | string>(key);

  if (!raw) {
    return NextResponse.json(
      { error: "OTP expired or not found. Request a new code." },
      { status: 400 }
    );
  }

  const record: OtpRecord = typeof raw === "string" ? JSON.parse(raw) : raw;
  record.attempts += 1;

  if (record.attempts > MAX_ATTEMPTS) {
    await redis.del(key);
    return NextResponse.json(
      { error: "Too many failed attempts. Request a new code." },
      { status: 400 }
    );
  }

  if (record.code !== code) {
    const ttl = await redis.ttl(key);
    await redis.set(key, JSON.stringify(record), { ex: Math.max(ttl, 1) });
    const remaining = MAX_ATTEMPTS - record.attempts;
    return NextResponse.json(
      { error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
      { status: 400 }
    );
  }

  // Correct — mark verified and clear OTP
  await Promise.all([
    db.update(user).set({ phoneVerified: true }).where(eq(user.id, session.user.id)),
    redis.del(key),
  ]);

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { sendSms } from "@/lib/sms";
import { db } from "@/lib/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { otpRatelimit } from "@/lib/rate-limit";

const OTP_TTL = 600; // 10 minutes

function normalizePhone(ph: string): string {
  if (ph.startsWith("+63")) return ph;
  if (ph.startsWith("09")) return "+63" + ph.slice(1);
  return ph;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 3 sends per 10 minutes per user
  if (otpRatelimit) {
    const { success } = await otpRatelimit.limit(session.user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait before trying again." },
        { status: 429 }
      );
    }
  }

  const u = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
  if (!u?.phone) {
    return NextResponse.json(
      { error: "No phone number saved. Add one in Settings first." },
      { status: 400 }
    );
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await Promise.all([
    redis.set(
      `otp:${session.user.id}`,
      JSON.stringify({ code, phone: u.phone, attempts: 0 }),
      { ex: OTP_TTL }
    ),
    db.update(user).set({ phoneVerified: false }).where(eq(user.id, session.user.id)),
  ]);

  try {
    await sendSms({
      to: normalizePhone(u.phone),
      message: `Your TCGMarket PH code: ${code}. Valid for 10 minutes. Do not share this code.`,
    });
  } catch (err) {
    console.error("[otp/send] SMS error:", err);
    return NextResponse.json(
      { error: "Failed to send SMS. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}

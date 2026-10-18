import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { sendMail } from "@/lib/mailer";
import { ChangeEmail } from "@/emails/ChangeEmail";
import { otpRatelimit } from "@/lib/rate-limit";

const TTL = 60 * 30; // 30 minutes

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (otpRatelimit) {
    const { success } = await otpRatelimit.limit(`change-email:${session.user.id}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 }
      );
    }
  }

  const body = await request.json().catch(() => ({}));
  const newEmail = typeof body.newEmail === "string" ? body.newEmail.trim().toLowerCase() : "";

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (newEmail === session.user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "That's already your current email address." },
      { status: 400 }
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  await redis.set(
    `email_change:${token}`,
    JSON.stringify({ userId: session.user.id, newEmail }),
    { ex: TTL }
  );

  const url = `${process.env.BETTER_AUTH_URL}/api/account/verify-email-change?token=${token}`;

  try {
    await sendMail({
      to: newEmail,
      subject: "Verify your new email — TCGMarket PH",
      template: createElement(ChangeEmail, {
        name: session.user.name,
        newEmail,
        url,
      }),
    });
  } catch (err) {
    console.error("[change-email] mail error:", err);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}

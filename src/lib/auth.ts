import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createElement } from "react";
import { db } from "./db";
import { sendMail } from "./mailer";
import { user, session, account, verification } from "@/db/schema/auth";
import { ResetPassword } from "@/emails/ResetPassword";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),

  user: {
    additionalFields: {
      displayName:      { type: "string",  required: false },
      phone:            { type: "string",  required: false },
      phoneVerified:    { type: "boolean", required: false, defaultValue: false, input: false },
      city:             { type: "string",  required: false },
      bio:              { type: "string",  required: false },
      games:            { type: "string",  required: false },
      kycStatus:        { type: "string",  required: false, defaultValue: "none",  input: false },
      sellerEnabled:    { type: "boolean", required: false, defaultValue: false,   input: false },
      subscriptionTier: { type: "string",  required: false, defaultValue: "free",  input: false },
      isAdmin:          { type: "boolean", required: false, defaultValue: false,   input: false },
      reputationScore:  { type: "number",  required: false, defaultValue: 0,       input: false },
      isBanned:         { type: "boolean", required: false, defaultValue: false,   input: false },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user: u, url }) => {
      try {
        await sendMail({
          to: u.email,
          subject: "Reset your TCGMarket password",
          template: createElement(ResetPassword, { name: u.name, url }),
        });
      } catch (err) {
        console.error("[mailer] sendResetPassword failed:", err);
      }
    },
  },

  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL!],
});

export type Session = typeof auth.$Infer.Session;

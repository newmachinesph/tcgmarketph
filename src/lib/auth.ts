import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createElement } from "react";
import { db } from "./db";
import { sendMail } from "./mailer";
import { user, session, account, verification } from "@/db/schema/auth";
import { VerifyEmail } from "@/emails/VerifyEmail";
import { ResetPassword } from "@/emails/ResetPassword";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user: u, url }) => {
      await sendMail({
        to: u.email,
        subject: "Reset your TCGMarket password",
        template: createElement(ResetPassword, { name: u.name, url }),
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user: u, url }) => {
      await sendMail({
        to: u.email,
        subject: "Verify your TCGMarket email",
        template: createElement(VerifyEmail, { name: u.name, url }),
      });
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

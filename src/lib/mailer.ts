import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({
  to,
  subject,
  template,
}: {
  to: string;
  subject: string;
  template: ReactElement;
}) {
  const html = await render(template);
  await transporter.sendMail({
    from: `"TCGMarket PH" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html,
  });
}

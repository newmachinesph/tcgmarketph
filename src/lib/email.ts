import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "TCGMarket PH <noreply@tcgmarket.ph>";
const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set — would have sent to ${to}: ${subject}`);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) console.error("[email] send error:", error);
}

// ── Transaction emails ────────────────────────────────────────────────────────

export async function emailTransactionCreated(opts: {
  sellerEmail: string;
  sellerName: string;
  buyerName: string;
  cardName: string;
  price: string;
  txnId: string;
}) {
  const link = `${BASE_URL}/transactions/${opts.txnId}`;
  await send(
    opts.sellerEmail,
    `New buy request for ${opts.cardName}`,
    `<p>Hi ${opts.sellerName},</p>
     <p><strong>${opts.buyerName}</strong> wants to buy your listing: <strong>${opts.cardName}</strong> for <strong>₱${parseFloat(opts.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong>.</p>
     <p><a href="${link}">Review the request →</a></p>
     <p>You have 48 hours to confirm or decline before the request expires.</p>
     <hr/><p style="color:#888;font-size:12px">Cash on meetup only. Meet in a public place, daytime.</p>`
  );
}

export async function emailTransactionAgreed(opts: {
  buyerEmail: string;
  buyerName: string;
  sellerName: string;
  cardName: string;
  price: string;
  txnId: string;
}) {
  const link = `${BASE_URL}/transactions/${opts.txnId}`;
  await send(
    opts.buyerEmail,
    `${opts.sellerName} confirmed your purchase of ${opts.cardName}`,
    `<p>Hi ${opts.buyerName},</p>
     <p><strong>${opts.sellerName}</strong> has confirmed your purchase of <strong>${opts.cardName}</strong> for <strong>₱${parseFloat(opts.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong>.</p>
     <p>You can now propose a meetup time and location.</p>
     <p><a href="${link}">View transaction →</a></p>
     <hr/><p style="color:#888;font-size:12px">Cash on meetup only. Meet in a public place, daytime, bring exact change.</p>`
  );
}

export async function emailTransactionCancelled(opts: {
  recipientEmail: string;
  recipientName: string;
  cardName: string;
  cancelledBy: string;
  reason?: string | null;
  txnId: string;
}) {
  const link = `${BASE_URL}/transactions/${opts.txnId}`;
  await send(
    opts.recipientEmail,
    `Transaction cancelled — ${opts.cardName}`,
    `<p>Hi ${opts.recipientName},</p>
     <p>The transaction for <strong>${opts.cardName}</strong> was cancelled by <strong>${opts.cancelledBy}</strong>.</p>
     ${opts.reason ? `<p>Reason: ${opts.reason}</p>` : ""}
     <p><a href="${link}">View transaction →</a></p>`
  );
}

export async function emailMeetupProposed(opts: {
  recipientEmail: string;
  recipientName: string;
  proposerName: string;
  cardName: string;
  location: string;
  proposedAt: Date;
  txnId: string;
}) {
  const link = `${BASE_URL}/transactions/${opts.txnId}`;
  const when  = opts.proposedAt.toLocaleString("en-PH", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
  await send(
    opts.recipientEmail,
    `Meetup proposed for ${opts.cardName}`,
    `<p>Hi ${opts.recipientName},</p>
     <p><strong>${opts.proposerName}</strong> has proposed a meetup for <strong>${opts.cardName}</strong>:</p>
     <ul><li>📍 ${opts.location}</li><li>🕐 ${when}</li></ul>
     <p><a href="${link}">Accept or decline →</a></p>
     <hr/><p style="color:#888;font-size:12px">Meet in a public place, daytime, bring exact change. Stay safe!</p>`
  );
}

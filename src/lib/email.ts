import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT ?? "587", 10),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM    = process.env.SMTP_FROM ?? process.env.EMAIL_FROM ?? "TCGMarket PH <noreply@tcgmarket.ph>";
const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

async function send(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`[email] SMTP not configured — would send to ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] send error:", err);
  }
}

// ── Transaction emails ────────────────────────────────────────────────────────

export async function emailTransactionCreated(opts: {
  sellerEmail: string;
  sellerName:  string;
  buyerName:   string;
  cardName:    string;
  price:       string;
  txnId:       string;
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
  buyerEmail:  string;
  buyerName:   string;
  sellerName:  string;
  cardName:    string;
  price:       string;
  txnId:       string;
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
  recipientName:  string;
  cardName:       string;
  cancelledBy:    string;
  reason?:        string | null;
  txnId:          string;
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
  recipientName:  string;
  proposerName:   string;
  cardName:       string;
  location:       string;
  proposedAt:     Date;
  txnId:          string;
}) {
  const link = `${BASE_URL}/transactions/${opts.txnId}`;
  const when  = opts.proposedAt.toLocaleString("en-PH", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone:  "Asia/Manila",
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

// ── Offer emails ──────────────────────────────────────────────────────────────

function phpFmt(price: string) {
  return "₱" + parseFloat(price).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

export async function emailOfferReceived(opts: {
  sellerEmail:  string;
  sellerName:   string;
  buyerName:    string;
  cardName:     string;
  listingPrice: string;
  offeredPrice: string;
  message?:     string | null;
  offerId:      string;
}) {
  const link = `${BASE_URL}/offers`;
  await send(
    opts.sellerEmail,
    `New offer on ${opts.cardName}`,
    `<p>Hi ${opts.sellerName},</p>
     <p><strong>${opts.buyerName}</strong> made an offer on your listing: <strong>${opts.cardName}</strong>.</p>
     <ul>
       <li>Your price: <strong>${phpFmt(opts.listingPrice)}</strong></li>
       <li>Their offer: <strong>${phpFmt(opts.offeredPrice)}</strong></li>
       ${opts.message ? `<li>Message: ${opts.message}</li>` : ""}
     </ul>
     <p><a href="${link}">Accept, decline, or counter →</a></p>
     <p style="color:#888;font-size:12px">Offer expires in 48 hours.</p>`
  );
}

export async function emailOfferAccepted(opts: {
  recipientEmail: string;
  recipientName:  string;
  cardName:       string;
  agreedPrice:    string;
  txnId:          string;
}) {
  const link = `${BASE_URL}/transactions/${opts.txnId}`;
  await send(
    opts.recipientEmail,
    `Offer accepted — ${opts.cardName}`,
    `<p>Hi ${opts.recipientName},</p>
     <p>The offer for <strong>${opts.cardName}</strong> at <strong>${phpFmt(opts.agreedPrice)}</strong> has been accepted.</p>
     <p>A transaction has been created. Arrange a safe meetup.</p>
     <p><a href="${link}">View transaction →</a></p>
     <hr/><p style="color:#888;font-size:12px">Cash on meetup. Meet in a public place, daytime.</p>`
  );
}

export async function emailOfferDeclined(opts: {
  buyerEmail: string;
  buyerName:  string;
  cardName:   string;
  offerId:    string;
}) {
  await send(
    opts.buyerEmail,
    `Your offer on ${opts.cardName} was declined`,
    `<p>Hi ${opts.buyerName},</p>
     <p>The seller declined your offer on <strong>${opts.cardName}</strong>.</p>
     <p>You can browse other listings or make a new offer.</p>
     <p><a href="${BASE_URL}/marketplace">Browse marketplace →</a></p>`
  );
}

export async function emailOfferCountered(opts: {
  buyerEmail:      string;
  buyerName:       string;
  sellerName:      string;
  cardName:        string;
  counterPrice:    string;
  counterMessage?: string | null;
  offerId:         string;
}) {
  const link = `${BASE_URL}/offers`;
  await send(
    opts.buyerEmail,
    `${opts.sellerName} countered your offer on ${opts.cardName}`,
    `<p>Hi ${opts.buyerName},</p>
     <p><strong>${opts.sellerName}</strong> countered your offer on <strong>${opts.cardName}</strong>.</p>
     <ul>
       <li>Counter price: <strong>${phpFmt(opts.counterPrice)}</strong></li>
       ${opts.counterMessage ? `<li>Message: ${opts.counterMessage}</li>` : ""}
     </ul>
     <p><a href="${link}">Accept or decline counter →</a></p>`
  );
}

export async function emailCounterDeclined(opts: {
  sellerEmail: string;
  sellerName:  string;
  cardName:    string;
  offerId:     string;
}) {
  await send(
    opts.sellerEmail,
    `Counter offer declined — ${opts.cardName}`,
    `<p>Hi ${opts.sellerName},</p>
     <p>The buyer declined your counter offer on <strong>${opts.cardName}</strong>.</p>
     <p>Your listing remains active.</p>
     <p><a href="${BASE_URL}/listings">Manage listings →</a></p>`
  );
}

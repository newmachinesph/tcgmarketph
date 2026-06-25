import { createHmac, timingSafeEqual } from "crypto";

const PAYMONGO_API = "https://api.paymongo.com/v1";

function authHeader(): string {
  const key = process.env.PAYMONGO_SECRET_KEY ?? "";
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

export interface PayMongoLink {
  id:          string;
  checkoutUrl: string;
}

/**
 * Creates a PayMongo Payment Link for the given amount.
 * amount is in PHP (not centavos) — we convert internally.
 * remarks embeds the transaction ID for webhook lookup.
 */
export async function createPaymentLink(opts: {
  amountPHP:   number;
  description: string;
  txnId:       string;
}): Promise<PayMongoLink> {
  const centavos = Math.round(opts.amountPHP * 100);

  const res = await fetch(`${PAYMONGO_API}/payment-links`, {
    method:  "POST",
    headers: {
      Authorization:  authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount:      centavos,
          description: opts.description,
          remarks:     `txn:${opts.txnId}`,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PayMongo API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const attr = json?.data?.attributes;

  if (!json?.data?.id || !attr?.checkout_url) {
    throw new Error("Unexpected PayMongo response: " + JSON.stringify(json));
  }

  return { id: json.data.id, checkoutUrl: attr.checkout_url };
}

/**
 * Verifies the Paymongo-Signature header.
 * Header format: t=<timestamp>,te=<test_sig>,li=<live_sig>
 * Signed payload: <timestamp>.<rawBody>
 */
export function verifyPayMongoSignature(
  rawBody:   string,
  sigHeader: string,
  secret:    string,
): boolean {
  try {
    const parts     = sigHeader.split(",");
    const tPart     = parts.find((p) => p.startsWith("t="));
    const liPart    = parts.find((p) => p.startsWith("li="));
    if (!tPart || !liPart) return false;

    const timestamp = tPart.slice(2);
    const liveSig   = liPart.slice(3);

    const payload  = `${timestamp}.${rawBody}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");

    const expBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(liveSig);
    if (expBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(expBuf, sigBuf);
  } catch {
    return false;
  }
}

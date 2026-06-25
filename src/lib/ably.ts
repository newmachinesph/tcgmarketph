import Ably from "ably";

// Server-side Ably client — uses root API key, never exposed to browser.
// Instantiated lazily so the module can be imported in environments where
// ABLY_API_KEY is absent (will be a no-op in that case).

let _server: Ably.Realtime | null = null;

function getServer() {
  if (!process.env.ABLY_API_KEY) return null;
  if (!_server) _server = new Ably.Realtime({ key: process.env.ABLY_API_KEY });
  return _server;
}

/**
 * Publish a bid update to the auction channel.
 * Channel name: `auction:${listingId}`
 * Event name:   `bid`
 */
export async function publishBid(listingId: string, payload: {
  amount:       string;
  bidderName:   string;
  currentBid:   string;
  auctionEnd:   string; // ISO — may be extended by anti-snipe
  bidCount:     number;
}) {
  const server = getServer();
  if (!server) {
    console.log(`[ably] ABLY_API_KEY not set — bid update not published for ${listingId}`);
    return;
  }
  const channel = server.channels.get(`auction:${listingId}`);
  await channel.publish("bid", payload);
}

const CACHE = "tcgmarketph-v2";
const PRECACHE = ["/", "/marketplace"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (e) => {
  if (!e.data) return;
  let payload;
  try { payload = e.data.json(); } catch { return; }

  const title   = payload.title ?? "TCGMarket PH";
  const options = {
    body:  payload.body  ?? "",
    icon:  "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    data:  { url: payload.url ?? "/" },
    vibrate: [200, 100, 200],
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});

// ── Network-first, same-origin only ──────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Only cache same-origin requests — skip cross-origin (images CDN, Ably, Google, etc.)
  // and skip non-http(s) schemes (chrome-extension, etc.)
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.origin !== self.location.origin
  ) return;

  // Skip API routes and Next.js internals — always go to network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

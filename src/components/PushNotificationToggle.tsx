"use client";

import { useEffect, useState } from "react";
import { BellIcon, BellSlashIcon } from "@heroicons/react/24/outline";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = "unsupported" | "default" | "denied" | "subscribed" | "loading";

export function PushNotificationToggle() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC) {
      setState("unsupported");
      return;
    }

    Notification.requestPermission === undefined
      ? setState("unsupported")
      : setState(Notification.permission === "denied" ? "denied" : "default");

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setState("subscribed");
        else if (Notification.permission === "denied") setState("denied");
        else setState("default");
      });
    }).catch(() => setState("unsupported"));
  }, []);

  async function subscribe() {
    setState("loading");
    try {
      const reg  = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState("denied"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(json),
      });
      setState("subscribed");
    } catch {
      setState("default");
    }
  }

  async function unsubscribe() {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("default");
    } catch {
      setState("subscribed");
    }
  }

  if (state === "unsupported") return null;

  if (state === "denied") {
    return (
      <div className="flex items-center gap-2 text-xs text-[#9A9A9A]">
        <BellSlashIcon className="size-4" />
        <span>Push blocked in browser — allow notifications in site settings.</span>
      </div>
    );
  }

  if (state === "subscribed") {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface2 px-3 py-1.5 text-xs font-medium text-[#F2F2F2] transition hover:border-white/20"
      >
        <BellIcon className="size-4 text-accent" />
        Push notifications on — turn off
      </button>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={state === "loading"}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface2 px-3 py-1.5 text-xs font-medium text-[#F2F2F2] transition hover:border-white/20 disabled:opacity-50"
    >
      <BellIcon className="size-4" />
      {state === "loading" ? "…" : "Enable push notifications"}
    </button>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Ably from "ably";
import { PaperAirplaneIcon, ArrowLeftIcon, NoSymbolIcon } from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";
import { ReportButton } from "@/components/ReportButton";

interface MsgEntry {
  id:          string;
  senderId:    string;
  body:        string;
  sentAt:      string;
  sender: {
    id:          string;
    name:        string;
    displayName: string | null;
    image:       string | null;
  };
}

interface ConvDetail {
  id:          string;
  listingId:   string | null;
  listingCard: string | null;
  other: {
    id:          string;
    name:        string;
    displayName: string | null;
    image:       string | null;
  } | null;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export default function ChatPage() {
  const { id }   = useParams<{ id: string }>();
  const { data: session } = authClient.useSession();
  const uid      = session?.user.id ?? "";

  const [conv, setConv]         = useState<ConvDetail | null>(null);
  const [msgs, setMsgs]         = useState<MsgEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [body, setBody]         = useState("");
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking]   = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    const [convRes, blocksRes] = await Promise.all([
      fetch(`/api/conversations/${id}/messages`),
      fetch("/api/blocks"),
    ]);
    const convData   = await convRes.json();
    const blocksData = await blocksRes.json();
    if (convRes.ok) {
      setConv({ ...convData.conversation, listingCard: convData.conversation.listingCard ?? null });
      setMsgs(convData.messages ?? []);
      // Check if we have blocked the other participant
      const otherId = convData.conversation?.other?.id;
      if (otherId && blocksRes.ok) {
        const blocked = (blocksData.blocks ?? []).some((b: { blockedId: string }) => b.blockedId === otherId);
        setIsBlocked(blocked);
      }
    }
    setLoading(false);
  }, [id]);

  async function toggleBlock() {
    if (!conv?.other) return;
    setBlocking(true);
    if (isBlocked) {
      await fetch(`/api/blocks/${conv.other.id}`, { method: "DELETE" });
      setIsBlocked(false);
    } else {
      await fetch("/api/blocks", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ blockedId: conv.other.id }),
      });
      setIsBlocked(true);
    }
    setBlocking(false);
  }

  useEffect(() => { load(); }, [load]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Ably subscription
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY) return;
    const client  = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY });
    const channel = client.channels.get(`chat:${id}`);

    channel.subscribe("message", (msg) => {
      const d = msg.data as MsgEntry & { senderName: string };
      setMsgs((prev) => {
        if (prev.some((m) => m.id === d.id)) return prev;
        return [...prev, {
          id:       d.id,
          senderId: d.senderId,
          body:     d.body,
          sentAt:   d.sentAt,
          sender:   { id: d.senderId, name: d.senderName, displayName: null, image: null },
        }];
      });
    });

    return () => { client.close(); };
  }, [id]);

  async function send() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError("");
    const res  = await fetch(`/api/conversations/${id}/messages`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ body: trimmed }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not send");
    } else {
      setBody("");
      // Optimistic append (Ably will also deliver it but deduplication handles it)
      const m = data.message;
      setMsgs((prev) => {
        if (prev.some((x) => x.id === m.id)) return prev;
        return [...prev, {
          id:       m.id,
          senderId: m.senderId,
          body:     m.body,
          sentAt:   m.sentAt,
          sender:   { id: m.senderId, name: m.senderName, displayName: null, image: null },
        }];
      });
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Group messages by date
  const grouped: { date: string; msgs: MsgEntry[] }[] = [];
  for (const m of msgs) {
    const d = fmtDate(m.sentAt);
    if (!grouped.length || grouped[grouped.length - 1].date !== d) {
      grouped.push({ date: d, msgs: [m] });
    } else {
      grouped[grouped.length - 1].msgs.push(m);
    }
  }

  const otherName = conv?.other?.displayName ?? conv?.other?.name ?? "…";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-primary px-4 py-3">
        <Link href="/messages" className="text-[#9A9A9A] hover:text-[#F2F2F2]">
          <ArrowLeftIcon className="size-5" />
        </Link>
        {conv?.other?.image ? (
          <img src={conv.other.image} alt={otherName} className="size-9 rounded-full object-cover" />
        ) : (
          <div className="flex size-9 items-center justify-center rounded-full bg-surface2 text-sm font-bold text-[#9A9A9A]">
            {otherName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#F2F2F2] truncate">{otherName}</p>
          {conv?.listingId && (
            <Link href={`/listings/${conv.listingId}`} className="text-[10px] text-accent hover:underline truncate block">
              re: {conv.listingCard ?? "listing"}
            </Link>
          )}
        </div>
        {conv?.other && (
          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={toggleBlock}
              disabled={blocking}
              className={`flex items-center gap-1.5 text-xs transition disabled:opacity-50 ${
                isBlocked ? "text-emerald-400 hover:text-emerald-300" : "text-[#9A9A9A] hover:text-red-400"
              }`}
            >
              <NoSymbolIcon className="size-3.5" />
              {isBlocked ? "Unblock" : "Block"}
            </button>
            <ReportButton targetType="user" targetId={conv.other.id} label="Report" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-2xl bg-surface" />)}
          </div>
        ) : msgs.length === 0 ? (
          <p className="text-center text-sm text-[#9A9A9A] mt-10">No messages yet. Say hi!</p>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">{group.date}</p>
              <div className="space-y-1.5">
                {group.msgs.map((m) => {
                  const isMe = m.senderId === uid;
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        isMe
                          ? "bg-accent text-white rounded-br-sm"
                          : "bg-surface border border-white/10 text-[#F2F2F2] rounded-bl-sm"
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`mt-0.5 text-[10px] text-right ${isMe ? "text-white/60" : "text-[#9A9A9A]"}`}>
                          {fmtTime(m.sentAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 bg-primary px-4 py-3">
        {isBlocked ? (
          <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            <span>You have blocked this user. Unblock to send messages.</span>
            <button onClick={toggleBlock} disabled={blocking} className="ml-3 font-semibold underline hover:text-red-300 disabled:opacity-50">
              Unblock
            </button>
          </div>
        ) : (
        <>
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message… (Enter to send)"
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none rounded-2xl border border-white/10 bg-surface px-4 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
            style={{ maxHeight: "6rem", overflowY: "auto" }}
          />
          <button
            onClick={send}
            disabled={!body.trim() || sending}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-white transition hover:bg-accent/80 disabled:opacity-40"
          >
            <PaperAirplaneIcon className="size-4" />
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

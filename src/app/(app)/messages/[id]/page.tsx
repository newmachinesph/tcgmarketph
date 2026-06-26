"use client";

import { useParams } from "next/navigation";
import { ChatView } from "@/components/ChatView";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <ChatView convId={id} />
    </div>
  );
}

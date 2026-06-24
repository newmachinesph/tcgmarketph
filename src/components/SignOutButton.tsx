"use client";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleSignOut}
      className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-[#9A9A9A] transition-colors hover:bg-surface hover:text-[#F2F2F2]"
    >
      Sign Out
    </button>
  );
}

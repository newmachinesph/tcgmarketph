import Link from "next/link";

const LABELS: Record<string, string> = {
  offers:       "Offer alerts",
  messages:     "Message notifications",
  wishlist:     "Wishlist alerts",
  transactions: "Transaction updates",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const { status, category } = await searchParams;
  const label = category ? (LABELS[category] ?? category) : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1E1E1E] p-8 text-center">
        {status === "success" ? (
          <>
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-[#5DCAA5]/10 text-3xl font-bold text-[#5DCAA5]">
              ✓
            </div>
            <h1 className="text-xl font-bold text-[#F2F2F2]">Unsubscribed</h1>
            <p className="mt-2 text-sm text-[#9A9A9A]">
              {label ? (
                <>
                  You&apos;ve been unsubscribed from{" "}
                  <strong className="text-[#F2F2F2]">{label}</strong> emails.
                </>
              ) : (
                "You've been unsubscribed."
              )}
            </p>
            <p className="mt-4 text-xs text-[#9A9A9A]">
              You can re-enable this anytime in{" "}
              <Link href="/settings" className="text-[#E24B4A] hover:underline">
                Settings → Notifications
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-[#E24B4A]/10 text-2xl font-bold text-[#E24B4A]">
              ✕
            </div>
            <h1 className="text-xl font-bold text-[#F2F2F2]">Invalid link</h1>
            <p className="mt-2 text-sm text-[#9A9A9A]">
              This unsubscribe link is invalid or has already been used.
            </p>
            <p className="mt-4 text-xs text-[#9A9A9A]">
              Manage email preferences in{" "}
              <Link href="/settings" className="text-[#E24B4A] hover:underline">
                Settings
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}

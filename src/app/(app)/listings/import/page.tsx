import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getTierLimits } from "@/lib/constants/tiers";
import { CSVImportForm } from "./CSVImportForm";
import Link from "next/link";
import { ListBulletIcon } from "@heroicons/react/24/outline";

export default async function CSVImportPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (!session.user.phoneVerified) redirect("/verify");

  const tier   = (session.user.subscriptionTier ?? "free") as string;
  const limits = getTierLimits(tier);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 py-10 lg:px-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Import from CSV</h1>
          <p className="mt-1 text-sm text-[#9A9A9A]">
            Upload a CSV file to create up to 100 listings at once · {limits.maxActiveListings} listing cap on {tier} tier
          </p>
        </div>
        <Link
          href="/listings/bulk"
          className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
        >
          <ListBulletIcon className="size-4" />
          Bulk Form
        </Link>
      </div>

      <CSVImportForm />
    </div>
  );
}

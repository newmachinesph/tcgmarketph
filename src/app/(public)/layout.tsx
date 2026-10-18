import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="min-h-screen bg-primary text-[#F2F2F2]">
      <PublicHeader />
      <main className="pb-20 lg:pb-0">{children}</main>
      <PublicFooter />
      <MobileBottomNav isAuthenticated={!!session} />
    </div>
  );
}

import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary text-[#F2F2F2]">
      <PublicHeader />
      <main className="pb-16 lg:pb-0">{children}</main>
      <PublicFooter />
      <MobileBottomNav />
    </div>
  );
}

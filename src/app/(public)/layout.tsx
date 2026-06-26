import { PublicHeader } from "@/components/PublicHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary text-[#F2F2F2]">
      <PublicHeader />
      <main>{children}</main>
    </div>
  );
}

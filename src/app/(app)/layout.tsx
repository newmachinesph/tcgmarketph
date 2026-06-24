import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-primary">
      <AppHeader user={session.user} />
      <main>{children}</main>
    </div>
  );
}

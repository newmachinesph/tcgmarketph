import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-primary p-8">
      <h1 className="text-2xl font-bold text-[#F2F2F2]">
        Welcome, {session.user.name}
      </h1>
      <p className="text-sm text-[#9A9A9A]">{session.user.email}</p>
      <SignOutButton />
    </main>
  );
}

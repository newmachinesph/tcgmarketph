import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  async function signOut() {
    "use server";
    await auth.api.signOut({ headers: await headers() });
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-primary p-8">
      <h1 className="text-2xl font-bold text-[#F2F2F2]">
        Welcome, {session.user.name}
      </h1>
      <p className="text-sm text-[#9A9A9A]">{session.user.email}</p>
      <form action={signOut}>
        <button
          type="submit"
          className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-[#9A9A9A] transition-colors hover:bg-surface hover:text-[#F2F2F2]"
        >
          Sign Out
        </button>
      </form>
    </main>
  );
}

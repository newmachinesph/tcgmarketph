import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { UserMenu } from "./UserMenu";
import { NotificationsBell } from "./NotificationsBell";
import { MessagesNavItem } from "./MessagesUnread";
import { PublicMobileMenu } from "./PublicMobileMenu";
import { PublicNav } from "./PublicNav";


export async function PublicHeader() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user    = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-primary/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-5 px-6 lg:px-10">

        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="shrink-0 text-xl font-extrabold tracking-tight text-accent">
          TCGMarket<span className="text-[#F2F2F2]">PH</span>
        </Link>

        <PublicNav />

        {/* Right */}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <MessagesNavItem />
              <NotificationsBell />
              <UserMenu
                name={user.name}
                displayName={(user as { displayName?: string | null }).displayName}
                email={user.email}
                image={user.image}
                isAdmin={!!(user as { isAdmin?: boolean | null }).isAdmin}
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[#9A9A9A] transition hover:text-[#F2F2F2] sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Get started
              </Link>
            </>
          )}
          <PublicMobileMenu isLoggedIn={!!user} />
        </div>
      </div>
    </header>
  );
}

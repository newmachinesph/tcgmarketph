import { BellIcon } from "@heroicons/react/24/outline";
import { UserMenu } from "./UserMenu";

interface AppHeaderProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    displayName?: string | null;
    isAdmin?: boolean | null;
  };
}

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Browse", href: "#", disabled: true },
  { label: "Sell", href: "#", disabled: true },
];

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-primary/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-6 px-6 lg:px-10">

        {/* Logo */}
        <a href="/dashboard" className="shrink-0 text-xl font-extrabold tracking-tight text-accent">
          TCGMarket
        </a>

        {/* Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) =>
            item.disabled ? (
              <span
                key={item.label}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#9A9A9A]/40 cursor-not-allowed"
                title="Coming soon"
              >
                {item.label}
              </span>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#9A9A9A] transition hover:bg-surface hover:text-[#F2F2F2]"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Right */}
        <div className="ml-auto flex items-center gap-2">
          <button
            className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
            aria-label="Notifications"
          >
            <BellIcon className="size-5" />
          </button>

          <UserMenu
            name={user.name}
            displayName={user.displayName}
            email={user.email}
            image={user.image}
            isAdmin={user.isAdmin ?? false}
          />
        </div>
      </div>
    </header>
  );
}

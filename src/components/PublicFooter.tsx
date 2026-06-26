import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-primary">
      <div className="mx-auto w-full max-w-screen-xl px-6 py-12 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-[#F2F2F2]">TCGMarket PH</p>
            <p className="text-xs leading-relaxed text-[#9A9A9A]">
              The Philippines&apos; cash-on-meetup marketplace for Pokémon and One Piece trading cards.
            </p>
            <p className="text-[10px] text-[#9A9A9A]/60">🇵🇭 Made in the Philippines</p>
          </div>

          {/* Marketplace */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Marketplace</p>
            <ul className="space-y-2">
              {[
                { label: "Browse listings",  href: "/marketplace" },
                { label: "Find sellers",     href: "/sellers"     },
                { label: "Create account",   href: "/signup"      },
                { label: "Sign in",          href: "/login"       },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-[#9A9A9A] transition hover:text-[#F2F2F2]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Company</p>
            <ul className="space-y-2">
              {[
                { label: "About us", href: "/about"  },
                { label: "FAQ",      href: "/faq"    },
                { label: "Safety",   href: "/safety" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-[#9A9A9A] transition hover:text-[#F2F2F2]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Support</p>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@tcgmarket.ph" className="text-xs text-[#9A9A9A] transition hover:text-[#F2F2F2]">
                  support@tcgmarket.ph
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-[10px] text-[#9A9A9A]/60">© 2026 TCGMarket PH. All rights reserved.</p>
          <p className="text-[10px] text-[#9A9A9A]/60">Cash on meetup · Public places · Inspect before you pay</p>
        </div>
      </div>
    </footer>
  );
}

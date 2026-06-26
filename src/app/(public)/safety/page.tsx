import Link from "next/link";
import {
  MapPinIcon,
  SunIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  PhoneIcon,
  CameraIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export const metadata = {
  title: "Safety Guide — TCGMarket PH",
  description: "How to trade safely on TCGMarket PH. Meetup tips, red flags to avoid, and what to do if something goes wrong.",
};

const MEETUP_TIPS = [
  { icon: MapPinIcon, title: "Pick a public place", body: "Malls, McDonald's, Jollibee, coffee shops, convenience stores. Anywhere busy with foot traffic and CCTV coverage. Never agree to meet at someone's home or in a parking lot." },
  { icon: SunIcon, title: "Daytime only", body: "Schedule meetups during the day. More people around means more witnesses and less opportunity for bad actors. After-hours meetups are unnecessary — a real seller will accommodate you." },
  { icon: UserGroupIcon, title: "Bring a friend", body: "Especially for high-value transactions over ₱5,000. A second person is a deterrent and a witness. There's safety in numbers." },
  { icon: PhoneIcon, title: "Communicate on-platform", body: "Use TCGMarket PH messaging. It creates a record of what was agreed. Sellers who insist on moving to Messenger or Viber before you've met are a red flag." },
  { icon: CameraIcon, title: "Inspect carefully", body: "Check the card under good lighting. Compare to the listing photos. Look for print lines, weight differences (slabs), corner wear, and holo scrape. If it doesn't match — don't pay." },
  { icon: ClockIcon, title: "Don't rush", body: "Pressure to 'decide quickly' or 'another buyer is waiting' is a manipulation tactic. Legitimate sellers will give you time to inspect the card before you hand over cash." },
];

const GREEN_FLAGS = [
  "Phone-verified account with history of completed deals",
  "KYC verified badge (identity confirmed)",
  "Multiple 5-star ratings with detailed comments",
  "Listing photos are real, high-quality, with natural backgrounds",
  "Responds promptly and answers questions directly",
  "Proposes a well-known, busy public location",
  "Price is close to market reference (not suspiciously cheap)",
];

const RED_FLAGS = [
  "Asking you to pay before meeting ('reservation fee')",
  "Only willing to ship — refuses meetup for local items",
  "New account, zero ratings, zero completed deals",
  "Photos look like they're taken from the internet (stock images)",
  "Pushes you to communicate outside the platform",
  "Refuses to show the card under different angles or lighting",
  "Price is dramatically below market with 'urgent sale' excuse",
  "Cancels and reschedules multiple times",
];

const VERIFICATION = [
  { icon: PhoneIcon, label: "Phone verified", desc: "Confirmed Philippine mobile number — harder to create fake accounts." },
  { icon: ShieldCheckIcon, label: "KYC verified", desc: "Government ID submitted and verified through our identity partner." },
  { icon: CheckCircleIcon, label: "Reputation score", desc: "Built from real completed transactions — can't be faked." },
];

export default function SafetyPage() {
  return (
    <div className="mx-auto w-full max-w-screen-lg px-6 py-16 lg:px-10 space-y-20">

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-bid/30 bg-bid/10 px-4 py-1.5 text-xs font-semibold text-bid">
          <ShieldCheckIcon className="size-3.5" /> Safety guide
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[#F2F2F2] lg:text-5xl">
          How to trade safely
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-[#9A9A9A]">
          Cash-on-meetup trading is inherently safe — both sides can walk away if anything feels wrong.
          These tips make it even safer.
        </p>
      </div>

      {/* Golden rule */}
      <div className="rounded-3xl border border-bid/20 bg-bid/5 p-8 text-center">
        <p className="text-3xl font-bold text-[#F2F2F2]">💡 Golden rule</p>
        <p className="mt-4 text-xl font-semibold text-bid">
          Card and cash exchange at the same time, face-to-face.
        </p>
        <p className="mt-3 text-sm text-[#9A9A9A]">
          Never send money in advance. Never hand over the card before you've counted the cash.
          If anyone asks you to deviate from this — walk away.
        </p>
      </div>

      {/* Meetup tips */}
      <div>
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Before you meet</p>
        <h2 className="text-center text-2xl font-bold text-[#F2F2F2]">Meetup safety tips</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MEETUP_TIPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-surface p-5">
              <Icon className="mb-3 size-5 text-bid" />
              <h3 className="font-semibold text-[#F2F2F2]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Green / red flags */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-bid/20 bg-bid/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircleIcon className="size-5 text-bid" />
            <h3 className="font-semibold text-[#F2F2F2]">Green flags — signs of a trustworthy seller</h3>
          </div>
          <ul className="space-y-2">
            {GREEN_FLAGS.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-[#9A9A9A]">
                <span className="mt-0.5 shrink-0 text-bid">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <XCircleIcon className="size-5 text-accent" />
            <h3 className="font-semibold text-[#F2F2F2]">Red flags — walk away immediately</h3>
          </div>
          <ul className="space-y-2">
            {RED_FLAGS.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-[#9A9A9A]">
                <span className="mt-0.5 shrink-0 text-accent">✗</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Platform trust features */}
      <div>
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Built into the platform</p>
        <h2 className="text-center text-2xl font-bold text-[#F2F2F2]">How TCGMarket PH protects you</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {VERIFICATION.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-surface p-5 text-center">
              <Icon className="mx-auto mb-3 size-6 text-bid" />
              <p className="font-semibold text-[#F2F2F2]">{label}</p>
              <p className="mt-2 text-sm text-[#9A9A9A]">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What to do if something goes wrong */}
      <div className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-8">
        <div className="flex items-center gap-2 mb-4">
          <ExclamationTriangleIcon className="size-5 text-orange-400" />
          <h2 className="text-xl font-bold text-[#F2F2F2]">If something goes wrong</h2>
        </div>
        <div className="space-y-4 text-sm text-[#9A9A9A]">
          <div>
            <p className="font-semibold text-[#F2F2F2]">1. Don't pay / don't hand over the card</p>
            <p>If you arrive and something feels off — the card looks different, the person seems nervous, or they're pushing you to hurry — trust your gut and leave.</p>
          </div>
          <div>
            <p className="font-semibold text-[#F2F2F2]">2. File a dispute or report through the platform</p>
            <p>Use the dispute button in your transaction, or the report button on the listing or seller profile. Our admin team reviews every report within 24 hours.</p>
          </div>
          <div>
            <p className="font-semibold text-[#F2F2F2]">3. Report to your local authorities if fraud occurred</p>
            <p>If you were defrauded, file a report with the PNP or NBI Cybercrime Division. Our team can provide platform records to support your report.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#F2F2F2]">Ready to trade safely?</h2>
        <p className="text-[#9A9A9A]">Browse verified sellers and listings — no account needed to look.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/marketplace" className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent/90">
            Browse marketplace <ArrowRightIcon className="size-4" />
          </Link>
          <Link href="/faq" className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]">
            Read the FAQ
          </Link>
        </div>
      </div>

    </div>
  );
}

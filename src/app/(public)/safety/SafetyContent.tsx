"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import {
  MapPinIcon, SunIcon, UserGroupIcon, PhoneIcon, CameraIcon, ClockIcon,
  ShieldCheckIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ArrowRightIcon,
} from "@heroicons/react/24/outline";

const EASE_EXPO = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.6, ease: EASE_EXPO } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

const MEETUP_TIPS = [
  { icon: MapPinIcon,   title: "Pick a public place",     body: "Malls, McDonald's, Jollibee, coffee shops, convenience stores. Anywhere busy with foot traffic and CCTV. Never agree to meet at someone's home." },
  { icon: SunIcon,      title: "Daytime only",            body: "Schedule meetups during the day. More people around means more witnesses. After-hours meetups are unnecessary — a real seller will accommodate you." },
  { icon: UserGroupIcon,title: "Bring a friend",          body: "Especially for high-value transactions over ₱5,000. A second person is a deterrent and a witness. There's safety in numbers." },
  { icon: PhoneIcon,    title: "Communicate on-platform", body: "Use TCGMarket PH messaging — it creates a record. Sellers who insist on moving to Messenger or Viber before you've met are a red flag." },
  { icon: CameraIcon,   title: "Inspect carefully",       body: "Check the card under good lighting. Compare to listing photos. Look for print lines, corner wear, and holo scrape. If it doesn't match — don't pay." },
  { icon: ClockIcon,    title: "Don't rush",              body: "Pressure to 'decide quickly' is a manipulation tactic. Legitimate sellers will give you time to inspect the card before you hand over cash." },
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
  { icon: PhoneIcon,        label: "Phone verified", desc: "Confirmed Philippine mobile number — harder to create fake accounts." },
  { icon: ShieldCheckIcon,  label: "KYC verified",   desc: "Government ID submitted and verified through our identity partner." },
  { icon: CheckCircleIcon,  label: "Reputation score", desc: "Built from real completed transactions — can't be faked." },
];

const EMERGENCY_STEPS = [
  { title: "Don't pay / don't hand over the card",
    body: "If you arrive and something feels off — the card looks different, the person seems nervous, or they're pushing you to hurry — trust your gut and leave." },
  { title: "File a dispute or report through the platform",
    body: "Use the dispute button in your transaction, or the report button on the listing or seller profile. Our admin team reviews every report within 24 hours." },
  { title: "Report to your local authorities if fraud occurred",
    body: "If you were defrauded, file a report with the PNP or NBI Cybercrime Division. Our team can provide platform records to support your report." },
];

export function SafetyContent() {
  const heroRef    = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="relative mx-auto w-full max-w-screen-lg px-6 py-16 lg:px-10 space-y-24 overflow-hidden">

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-bid/[0.04] blur-[150px]" />
        <div className="absolute right-0 bottom-1/3 h-[350px] w-[350px] rounded-full bg-accent/[0.03] blur-[120px]" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Hero */}
      <div ref={heroRef} className="text-center space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={heroInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: EASE_EXPO }}
          className="inline-flex items-center gap-2 rounded-full border border-bid/30 bg-bid/10 px-4 py-1.5 text-xs font-semibold text-bid"
        >
          <ShieldCheckIcon className="size-3.5" /> Safety guide
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE_EXPO }}
          className="font-display text-5xl font-bold tracking-tight text-[#F2F2F2] lg:text-6xl"
        >
          How to trade{" "}
          <span className="bg-gradient-to-r from-bid via-[#F2F2F2] to-bid bg-clip-text text-transparent">
            safely
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.2, ease: EASE_EXPO }}
          className="mx-auto max-w-xl text-lg leading-relaxed text-[#9A9A9A]"
        >
          Cash-on-meetup trading is inherently safe — both sides can walk away if anything feels wrong.
          These tips make it even safer.
        </motion.p>
      </div>

      {/* Golden rule */}
      <Reveal>
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl border border-bid/25 bg-bid/[0.05] p-10 lg:p-14 text-center"
        >
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(93,202,165,0.08),transparent)]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-bid/60 to-transparent" />
          <div className="relative">
            <p className="text-3xl mb-2">💡</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A9A9A] mb-4">Golden rule</p>
            <p className="text-2xl font-bold text-bid lg:text-3xl">
              Card and cash exchange at the same time, face-to-face.
            </p>
            <p className="mt-4 text-[15px] text-[#9A9A9A] max-w-lg mx-auto">
              Never send money in advance. Never hand over the card before you&apos;ve counted the cash.
              If anyone asks you to deviate from this — walk away.
            </p>
          </div>
        </motion.div>
      </Reveal>

      {/* Meetup tips */}
      <div>
        <Reveal className="mb-10 text-center">
          <motion.p variants={fadeUp} className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A9A9A]">Before you meet</motion.p>
          <motion.h2 variants={fadeUp} className="font-display mt-3 text-3xl font-bold text-[#F2F2F2]">Meetup safety tips</motion.h2>
        </Reveal>

        <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MEETUP_TIPS.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ scale: 1.015, boxShadow: "0 20px 60px -12px rgba(93,202,165,0.1)", transition: { type: "spring", stiffness: 300, damping: 22 } }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface p-6 transition-[border-color] duration-300 hover:border-bid/25"
            >
              <div className="pointer-events-none absolute inset-0 bg-bid/[0.04] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 inline-flex rounded-xl p-2.5 bg-bid/10 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-3deg]">
                  <Icon className="size-5 text-bid" />
                </div>
                <h3 className="font-semibold text-[#F2F2F2]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">{body}</p>
              </div>
            </motion.div>
          ))}
        </Reveal>
      </div>

      {/* Green / Red flags */}
      <Reveal className="grid gap-4 md:grid-cols-2">
        {/* Green */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl border border-bid/20 bg-bid/[0.04] p-6"
        >
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_top_left,rgba(93,202,165,0.06),transparent_60%)]" />
          <div className="relative">
            <div className="mb-5 flex items-center gap-2">
              <CheckCircleIcon className="size-5 text-bid" />
              <h3 className="font-semibold text-[#F2F2F2]">Green flags — trust these sellers</h3>
            </div>
            <ul className="space-y-2.5">
              {GREEN_FLAGS.map((f, i) => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE_EXPO }}
                  className="flex items-start gap-2 text-sm text-[#9A9A9A]"
                >
                  <span className="mt-px shrink-0 font-bold text-bid">✓</span> {f}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Red */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl border border-accent/20 bg-accent/[0.04] p-6"
        >
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_top_left,rgba(226,75,74,0.06),transparent_60%)]" />
          <div className="relative">
            <div className="mb-5 flex items-center gap-2">
              <XCircleIcon className="size-5 text-accent" />
              <h3 className="font-semibold text-[#F2F2F2]">Red flags — walk away immediately</h3>
            </div>
            <ul className="space-y-2.5">
              {RED_FLAGS.map((f, i) => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE_EXPO }}
                  className="flex items-start gap-2 text-sm text-[#9A9A9A]"
                >
                  <span className="mt-px shrink-0 font-bold text-accent">✗</span> {f}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </Reveal>

      {/* Platform trust features */}
      <div>
        <Reveal className="mb-10 text-center">
          <motion.p variants={fadeUp} className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A9A9A]">Built into the platform</motion.p>
          <motion.h2 variants={fadeUp} className="font-display mt-3 text-3xl font-bold text-[#F2F2F2]">How TCGMarket PH protects you</motion.h2>
        </Reveal>

        <Reveal className="grid gap-3 sm:grid-cols-3">
          {VERIFICATION.map(({ icon: Icon, label, desc }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              whileHover={{ scale: 1.015, transition: { type: "spring", stiffness: 300, damping: 22 } }}
              className="rounded-2xl border border-white/[0.08] bg-surface p-6 text-center"
            >
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-bid/10">
                <Icon className="size-6 text-bid" />
              </div>
              <p className="font-semibold text-[#F2F2F2]">{label}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">{desc}</p>
            </motion.div>
          ))}
        </Reveal>
      </div>

      {/* If something goes wrong */}
      <Reveal>
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl border border-orange-400/20 bg-orange-400/[0.04] p-8"
        >
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_top_left,rgba(251,146,60,0.06),transparent_60%)]" />
          <div className="relative">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-orange-400/10">
                <ExclamationTriangleIcon className="size-4 text-orange-400" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#F2F2F2]">If something goes wrong</h2>
            </div>
            <div className="space-y-5">
              {EMERGENCY_STEPS.map(({ title, body }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45, ease: EASE_EXPO }}
                >
                  <p className="font-semibold text-[#F2F2F2] flex items-center gap-2">
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-400/15 text-[11px] font-bold text-orange-400">
                      {i + 1}
                    </span>
                    {title}
                  </p>
                  <p className="mt-1.5 ml-7 text-sm leading-relaxed text-[#9A9A9A]">{body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </Reveal>

      {/* CTA */}
      <Reveal className="text-center">
        <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold text-[#F2F2F2]">Ready to trade safely?</motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-[#9A9A9A]">Browse verified sellers and listings — no account needed to look.</motion.p>
        <motion.div variants={fadeUp} className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/marketplace" className="flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 active:scale-95">
            Browse marketplace <ArrowRightIcon className="size-4" />
          </Link>
          <Link href="/faq" className="rounded-xl border border-white/10 px-7 py-3.5 text-sm font-semibold text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]">
            Read the FAQ
          </Link>
        </motion.div>
      </Reveal>

    </div>
  );
}

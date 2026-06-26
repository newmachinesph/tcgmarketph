"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  BellIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  KeyIcon,
  TrashIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";
import {
  changePasswordSchema,
  changeEmailSchema,
  deleteAccountSchema,
  type ChangePasswordInput,
  type ChangeEmailInput,
  type DeleteAccountInput,
} from "@/lib/validations/auth";
import { Field } from "@/components/ui";
import { useCurrencyStore, type Currency } from "@/store/currency";
import type { EmailPrefs, PrefCategory } from "@/lib/email-prefs-shared";
import { DEFAULT_PREFS, PREF_LABELS } from "@/lib/email-prefs-shared";

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserProps {
  id:                string;
  name:              string | null;
  email:             string;
  image:             string | null;
  phone:             string | null;
  phoneVerified:     boolean;
  preferredCurrency: string;
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
      <div className="border-b border-white/10 px-6 py-4">
        <h2 className="text-sm font-semibold text-[#F2F2F2]">{title}</h2>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  description,
  action,
  children,
}: {
  icon:        React.ElementType;
  label:       string;
  description: React.ReactNode;
  action?:     React.ReactNode;
  children?:   React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface2">
          <Icon className="size-4 text-[#9A9A9A]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#F2F2F2]">{label}</p>
          <p className="mt-0.5 text-xs text-[#9A9A9A]">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function ComingSoonBadge() {
  return (
    <span className="rounded-full bg-surface2 px-2.5 py-1 text-[10px] font-bold uppercase text-[#9A9A9A]">
      Coming soon
    </span>
  );
}

function Toggle({ checked, disabled = false, onChange }: {
  checked:  boolean;
  disabled?: boolean;
  onChange?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-accent" : "bg-surface2"
      }`}
    >
      <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-5" : "translate-x-0.5"
      }`} />
    </button>
  );
}

function ToggleBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-white/10 bg-surface2 px-3 py-1.5 text-xs font-medium text-[#F2F2F2] transition hover:border-white/20"
    >
      {label}
    </button>
  );
}

function inputCls(invalid?: boolean) {
  return [
    "w-full rounded-lg border bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A]",
    "focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20",
    invalid ? "border-red-400/50" : "border-white/10",
  ].join(" ");
}

// ── Email Preferences ──────────────────────────────────────────────────────────

const PREF_ICONS: Record<PrefCategory, React.ElementType> = {
  offers:       BellIcon,
  messages:     EnvelopeIcon,
  wishlist:     BellIcon,
  transactions: EnvelopeIcon,
};

function EmailPrefsSection() {
  const [prefs, setPrefs]   = useState<EmailPrefs | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/email-prefs")
      .then((r) => r.json())
      .then((d) => { if (d.prefs) setPrefs(d.prefs); });
  }, []);

  async function toggle(category: PrefCategory) {
    if (!prefs || saving) return;
    const enabled = !prefs[category];
    setPrefs((p) => p ? { ...p, [category]: enabled } : p);
    setSaving(category);
    const res = await fetch("/api/account/email-prefs", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ category, enabled }),
    });
    if (!res.ok) {
      setPrefs((p) => p ? { ...p, [category]: !enabled } : p);
      toast.error("Failed to save preference");
    }
    setSaving(null);
  }

  const cats = Object.keys(DEFAULT_PREFS) as PrefCategory[];

  return (
    <Section title="Email Notifications">
      {prefs === null ? (
        <div className="space-y-3 px-6 py-4">
          {cats.map((k) => <div key={k} className="h-4 w-48 animate-pulse rounded bg-surface2" />)}
        </div>
      ) : (
        cats.map((cat) => {
          const Icon = PREF_ICONS[cat];
          const meta = PREF_LABELS[cat];
          return (
            <Row
              key={cat}
              icon={Icon}
              label={meta.label}
              description={meta.description}
              action={
                <Toggle
                  checked={prefs[cat]}
                  disabled={saving !== null}
                  onChange={() => toggle(cat)}
                />
              }
            />
          );
        })
      )}
    </Section>
  );
}

// ── Change Password ────────────────────────────────────────────────────────────

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);

  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } =
    useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (data: ChangePasswordInput) => {
    const { error } = await (authClient as any).changePassword({
      currentPassword:     data.currentPassword,
      newPassword:         data.newPassword,
      revokeOtherSessions: false,
    });
    if (error) {
      setError("currentPassword", { message: error.message ?? "Incorrect current password." });
    } else {
      toast.success("Password updated.");
      reset();
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-6 mb-5 space-y-3 rounded-xl border border-white/10 bg-surface2 p-4" noValidate>
      <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
        <div className="relative">
          <input {...register("currentPassword")} id="currentPassword" type={showCurrent ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" className={inputCls(!!errors.currentPassword)} />
          <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#F2F2F2]">
            {showCurrent ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
      </Field>

      <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
        <div className="relative">
          <input {...register("newPassword")} id="newPassword" type={showNew ? "text" : "password"} placeholder="••••••••" autoComplete="new-password" className={inputCls(!!errors.newPassword)} />
          <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#F2F2F2]">
            {showNew ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
      </Field>

      <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm?.message}>
        <input {...register("confirm")} id="confirm" type="password" placeholder="••••••••" autoComplete="new-password" className={inputCls(!!errors.confirm)} />
      </Field>

      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50">
          {isSubmitting ? "Updating…" : "Update Password"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#9A9A9A] transition hover:text-[#F2F2F2]">Cancel</button>
      </div>
    </form>
  );
}

// ── Change Email ───────────────────────────────────────────────────────────────

function ChangeEmailForm({ currentEmail, onClose }: { currentEmail: string; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } =
    useForm<ChangeEmailInput>({ resolver: zodResolver(changeEmailSchema) });

  const onSubmit = async (data: ChangeEmailInput) => {
    const res  = await fetch("/api/account/change-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newEmail: data.newEmail }) });
    const json = await res.json();
    if (!res.ok) setError("newEmail", { message: json.error ?? "Something went wrong." });
    else setSent(true);
  };

  if (sent) {
    return (
      <div className="mx-6 mb-5 rounded-xl border border-bid/20 bg-bid/10 p-4 text-sm text-bid">
        Verification email sent. Click the link in your inbox to confirm your new address.
        <button onClick={onClose} className="ml-3 text-xs underline opacity-70 hover:opacity-100">Dismiss</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-6 mb-5 space-y-3 rounded-xl border border-white/10 bg-surface2 p-4" noValidate>
      <p className="text-xs text-[#9A9A9A]">Current: <span className="text-[#F2F2F2]">{currentEmail}</span></p>
      <Field label="New email address" htmlFor="newEmail" error={errors.newEmail?.message}>
        <input {...register("newEmail")} id="newEmail" type="email" placeholder="new@example.com" autoComplete="email" className={inputCls(!!errors.newEmail)} />
      </Field>
      <p className="text-[10px] text-[#9A9A9A]">Won&apos;t change until you verify the link.</p>
      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50">
          {isSubmitting ? "Sending…" : "Send Verification"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#9A9A9A] transition hover:text-[#F2F2F2]">Cancel</button>
      </div>
    </form>
  );
}

// ── Delete Account ─────────────────────────────────────────────────────────────

function DeleteAccountForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<DeleteAccountInput>({ resolver: zodResolver(deleteAccountSchema) });

  const onSubmit = async () => {
    const { error } = await (authClient as any).deleteUser();
    if (error) toast.error(error.message ?? "Failed to delete account.");
    else {
      toast.success("Account deleted.");
      await authClient.signOut();
      window.location.href = "/";
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-6 mb-5 space-y-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4" noValidate>
      <p className="text-xs text-red-400">This is permanent. All your listings, messages, and data will be deleted.</p>
      <Field label='Type "DELETE" to confirm' htmlFor="del-confirm" error={errors.confirm?.message}>
        <input {...register("confirm")} id="del-confirm" type="text" placeholder="DELETE" className={inputCls(!!errors.confirm)} autoComplete="off" />
      </Field>
      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={isSubmitting} className="rounded-lg border border-red-400 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-400/20 disabled:opacity-50">
          {isSubmitting ? "Deleting…" : "Delete My Account"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#9A9A9A] transition hover:text-[#F2F2F2]">Cancel</button>
      </div>
    </form>
  );
}

// ── Preferences ────────────────────────────────────────────────────────────────

function PreferencesSection({ initialCurrency }: { initialCurrency: string }) {
  const { currency, setCurrency } = useCurrencyStore();
  const [saving, setSaving] = useState(false);

  // Sync store with server value on first render
  useEffect(() => {
    if (!currency && initialCurrency) setCurrency(initialCurrency as Currency);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCurrency(c: Currency) {
    if (c === currency) return;
    setSaving(true);
    setCurrency(c);
    const res = await fetch("/api/account/currency", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currency: c }) });
    setSaving(false);
    if (!res.ok) toast.error("Failed to save currency preference");
    else toast.success(`Currency set to ${c}`);
  }

  return (
    <Section title="Preferences">
      <Row
        icon={CurrencyDollarIcon}
        label="Display currency"
        description="Prices throughout the app will use your chosen currency."
        action={
          <div className="flex items-center gap-1">
            {saving && <span className="mr-1 text-[10px] text-[#9A9A9A]">Saving…</span>}
            {(["PHP", "USD"] as const).map((c) => (
              <button key={c} onClick={() => handleCurrency(c)} disabled={saving}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                  (currency || initialCurrency) === c
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-white/10 text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]"
                }`}>
                {c === "PHP" ? "₱ PHP" : "$ USD"}
              </button>
            ))}
          </div>
        }
      />
    </Section>
  );
}

// ── Blocked Users ──────────────────────────────────────────────────────────────

interface BlockEntry {
  id: string; blockedId: string; createdAt: string;
  user: { id: string; name: string; displayName: string | null; image: string | null } | null;
}

function BlockedUsersSection() {
  const [blocks, setBlocks]   = useState<BlockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/blocks").then((r) => r.json()).then((d) => { setBlocks(d.blocks ?? []); setLoading(false); });
  }, []);

  async function unblock(blockedId: string) {
    setWorking(blockedId);
    await fetch(`/api/blocks/${blockedId}`, { method: "DELETE" });
    setBlocks((prev) => prev.filter((b) => b.blockedId !== blockedId));
    setWorking(null);
  }

  return (
    <Section title="Blocked Users">
      {loading ? (
        <div className="px-6 py-4"><div className="h-4 w-32 animate-pulse rounded bg-surface2" /></div>
      ) : blocks.length === 0 ? (
        <div className="px-6 py-4"><p className="text-sm text-[#9A9A9A]">You haven&apos;t blocked anyone.</p></div>
      ) : (
        blocks.map((b) => {
          const name = b.user?.displayName ?? b.user?.name ?? "Unknown user";
          return (
            <div key={b.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface2">
                {b.user?.image ? (
                  <img src={b.user.image} alt={name} className="size-9 rounded-xl object-cover" />
                ) : (
                  <NoSymbolIcon className="size-4 text-[#9A9A9A]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#F2F2F2]">{name}</p>
                <p className="text-xs text-[#9A9A9A]">Blocked {new Date(b.createdAt).toLocaleDateString("en-PH")}</p>
              </div>
              <button onClick={() => unblock(b.blockedId)} disabled={working === b.blockedId}
                className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-50">
                {working === b.blockedId ? "Unblocking…" : "Unblock"}
              </button>
            </div>
          );
        })
      )}
    </Section>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function SettingsClient({ user }: { user: UserProps }) {
  const [expanded, setExpanded] = useState<"password" | "email" | "delete" | null>(null);

  const emailChanged =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("message") === "email_changed";

  const toggle = (section: typeof expanded) =>
    setExpanded((prev) => (prev === section ? null : section));

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10 lg:px-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">Settings</h1>
        <p className="mt-1 text-sm text-[#9A9A9A]">Manage your account preferences and notifications.</p>
      </div>

      {emailChanged && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-bid/20 bg-bid/10 px-4 py-3">
          <p className="flex-1 text-sm text-bid">Your email has been updated. Please sign in with your new address.</p>
          <button onClick={() => window.history.replaceState({}, "", "/settings")}>
            <XMarkIcon className="size-4 text-bid/60" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        <PreferencesSection initialCurrency={user.preferredCurrency} />

        <EmailPrefsSection />

        <Section title="Other Notifications">
          <Row
            icon={DevicePhoneMobileIcon}
            label="SMS notifications"
            description={user.phoneVerified ? "Transaction alerts sent to your verified number." : "Verify your phone in Edit Profile to enable."}
            action={user.phoneVerified ? <Toggle checked={false} disabled /> : <ComingSoonBadge />}
          />
        </Section>

        <Section title="Security">
          <Row
            icon={EnvelopeIcon}
            label="Email address"
            description={user.email}
            action={<ToggleBtn label={expanded === "email" ? "Cancel" : "Change"} onClick={() => toggle("email")} />}
          >
            {expanded === "email" && <ChangeEmailForm currentEmail={user.email} onClose={() => setExpanded(null)} />}
          </Row>

          <Row
            icon={KeyIcon}
            label="Password"
            description="Change your account password."
            action={<ToggleBtn label={expanded === "password" ? "Cancel" : "Change"} onClick={() => toggle("password")} />}
          >
            {expanded === "password" && <ChangePasswordForm onClose={() => setExpanded(null)} />}
          </Row>

          <Row icon={ShieldCheckIcon} label="Two-factor authentication" description="Add an extra layer of security." action={<ComingSoonBadge />} />
        </Section>

        <BlockedUsersSection />

        <Section title="Danger Zone">
          <Row
            icon={TrashIcon}
            label="Delete account"
            description="Permanently remove your account and all your data."
            action={
              <button onClick={() => toggle("delete")} className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-400/10">
                {expanded === "delete" ? "Cancel" : "Delete"}
              </button>
            }
          >
            {expanded === "delete" && <DeleteAccountForm onClose={() => setExpanded(null)} />}
          </Row>
        </Section>
      </div>
    </div>
  );
}

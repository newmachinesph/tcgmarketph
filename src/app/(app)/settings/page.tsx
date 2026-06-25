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

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface overflow-hidden">
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
  icon: React.ElementType;
  label: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
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

function Toggle({ disabled = false }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-surface2 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      role="switch"
      aria-checked={false}
    >
      <span className="inline-block size-4 translate-x-0.5 rounded-full bg-[#9A9A9A] shadow transition-transform" />
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
    invalid ? "border-ask/50" : "border-white/10",
  ].join(" ");
}

// ─── Change Password ──────────────────────────────────────────────────────────

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (data: ChangePasswordInput) => {
    const { error } = await (authClient as any).changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: false,
    });
    if (error) {
      setError("currentPassword", {
        message: error.message ?? "Incorrect current password.",
      });
    } else {
      toast.success("Password updated.");
      reset();
      onClose();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-6 mb-5 space-y-3 rounded-xl border border-white/10 bg-surface2 p-4"
      noValidate
    >
      <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
        <div className="relative">
          <input
            {...register("currentPassword")}
            id="currentPassword"
            type={showCurrent ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            className={inputCls(!!errors.currentPassword)}
          />
          <button type="button" onClick={() => setShowCurrent(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#F2F2F2]">
            {showCurrent ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
      </Field>

      <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
        <div className="relative">
          <input
            {...register("newPassword")}
            id="newPassword"
            type={showNew ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            className={inputCls(!!errors.newPassword)}
          />
          <button type="button" onClick={() => setShowNew(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#F2F2F2]">
            {showNew ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
      </Field>

      <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm?.message}>
        <input
          {...register("confirm")}
          id="confirm"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          className={inputCls(!!errors.confirm)}
        />
      </Field>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
        >
          {isSubmitting ? "Updating…" : "Update Password"}
        </button>
        <button type="button" onClick={onClose}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#9A9A9A] hover:text-[#F2F2F2] transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Change Email ─────────────────────────────────────────────────────────────

function ChangeEmailForm({ currentEmail, onClose }: { currentEmail: string; onClose: () => void }) {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailInput>({ resolver: zodResolver(changeEmailSchema) });

  const onSubmit = async (data: ChangeEmailInput) => {
    const res = await fetch("/api/account/change-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail: data.newEmail }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError("newEmail", { message: json.error ?? "Something went wrong." });
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="mx-6 mb-5 rounded-xl border border-bid/20 bg-bid/10 p-4 text-sm text-bid">
        Verification email sent. Check your inbox and click the link to confirm your new address.
        <button onClick={onClose} className="ml-3 text-xs underline opacity-70 hover:opacity-100">Dismiss</button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-6 mb-5 space-y-3 rounded-xl border border-white/10 bg-surface2 p-4"
      noValidate
    >
      <p className="text-xs text-[#9A9A9A]">
        Current: <span className="text-[#F2F2F2]">{currentEmail}</span>
      </p>

      <Field label="New email address" htmlFor="newEmail" error={errors.newEmail?.message}>
        <input
          {...register("newEmail")}
          id="newEmail"
          type="email"
          placeholder="new@example.com"
          autoComplete="email"
          className={inputCls(!!errors.newEmail)}
        />
      </Field>

      <p className="text-[10px] text-[#9A9A9A]">
        A verification link will be sent to your new address. Your email won&apos;t change until you click it.
      </p>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
        >
          {isSubmitting ? "Sending…" : "Send Verification"}
        </button>
        <button type="button" onClick={onClose}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#9A9A9A] hover:text-[#F2F2F2] transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Delete Account ───────────────────────────────────────────────────────────

function DeleteAccountForm({ onClose }: { onClose: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountInput>({ resolver: zodResolver(deleteAccountSchema) });

  const onSubmit = async () => {
    const { error } = await (authClient as any).deleteUser();
    if (error) {
      toast.error(error.message ?? "Failed to delete account.");
    } else {
      toast.success("Account deleted.");
      await authClient.signOut();
      window.location.href = "/";
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-6 mb-5 space-y-3 rounded-xl border border-ask/20 bg-ask/5 p-4"
      noValidate
    >
      <p className="text-xs text-ask">
        This is permanent. All your listings, messages, and account data will be deleted and cannot be recovered.
      </p>

      <Field
        label='Type "DELETE" to confirm'
        htmlFor="del-confirm"
        error={errors.confirm?.message}
      >
        <input
          {...register("confirm")}
          id="del-confirm"
          type="text"
          placeholder="DELETE"
          className={inputCls(!!errors.confirm)}
          autoComplete="off"
        />
      </Field>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg border border-ask bg-ask/10 px-4 py-2 text-sm font-semibold text-ask transition hover:bg-ask/20 disabled:opacity-50"
        >
          {isSubmitting ? "Deleting…" : "Delete My Account"}
        </button>
        <button type="button" onClick={onClose}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#9A9A9A] hover:text-[#F2F2F2] transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Preferences section ──────────────────────────────────────────────────────

function PreferencesSection() {
  const { currency, setCurrency } = useCurrencyStore();
  const [saving, setSaving] = useState(false);

  async function handleCurrency(c: Currency) {
    if (c === currency) return;
    setSaving(true);
    setCurrency(c); // instant update
    const res = await fetch("/api/account/currency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: c }),
    });
    setSaving(false);
    if (!res.ok) toast.error("Failed to save currency preference");
    else toast.success(`Currency set to ${c}`);
  }

  return (
    <Section title="Preferences">
      <Row
        icon={CurrencyDollarIcon}
        label="Display currency"
        description="Prices throughout the app will be shown in your chosen currency."
        action={
          <div className="flex items-center gap-1">
            {saving && (
              <span className="mr-1 text-[10px] text-[#9A9A9A]">Saving…</span>
            )}
            {(["PHP", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => handleCurrency(c)}
                disabled={saving}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                  currency === c
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-white/10 text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]"
                }`}
              >
                {c === "PHP" ? "₱ PHP" : "$ USD"}
              </button>
            ))}
          </div>
        }
      />
    </Section>
  );
}

// ─── Blocked Users ────────────────────────────────────────────────────────────

interface BlockEntry {
  id:        string;
  blockedId: string;
  createdAt: string;
  user: { id: string; name: string; displayName: string | null; image: string | null } | null;
}

function BlockedUsersSection() {
  const [blocks, setBlocks]   = useState<BlockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/blocks")
      .then((r) => r.json())
      .then((d) => { setBlocks(d.blocks ?? []); setLoading(false); });
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
        <div className="px-6 py-4">
          <div className="h-4 w-32 animate-pulse rounded bg-surface2" />
        </div>
      ) : blocks.length === 0 ? (
        <div className="px-6 py-4">
          <p className="text-sm text-[#9A9A9A]">You haven&apos;t blocked anyone.</p>
        </div>
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
                <p className="text-xs text-[#9A9A9A]">
                  Blocked {new Date(b.createdAt).toLocaleDateString("en-PH")}
                </p>
              </div>
              <button
                onClick={() => unblock(b.blockedId)}
                disabled={working === b.blockedId}
                className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-50"
              >
                {working === b.blockedId ? "Unblocking…" : "Unblock"}
              </button>
            </div>
          );
        })
      )}
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  const [expanded, setExpanded] = useState<"password" | "email" | "delete" | null>(null);

  // Check for post-email-change redirect message
  const emailChanged =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("message") === "email_changed";

  type ExtendedUser = NonNullable<typeof session>["user"] & {
    phone?: string | null;
    phoneVerified?: boolean;
    preferredCurrency?: string;
  };
  const user = session?.user as ExtendedUser | undefined;

  const toggle = (section: typeof expanded) =>
    setExpanded((prev) => (prev === section ? null : section));

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10 lg:px-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">Settings</h1>
        <p className="mt-1 text-sm text-[#9A9A9A]">
          Manage your account preferences and notifications.
        </p>
      </div>

      {emailChanged && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-bid/20 bg-bid/10 px-4 py-3">
          <p className="text-sm text-bid flex-1">
            Your email has been updated. Please sign in with your new address.
          </p>
          <button onClick={() => window.history.replaceState({}, "", "/settings")}>
            <XMarkIcon className="size-4 text-bid/60" />
          </button>
        </div>
      )}

      <div className="space-y-6">

        {/* Preferences */}
        <PreferencesSection />

        {/* Notifications */}
        <Section title="Notifications">
          <Row
            icon={EnvelopeIcon}
            label="Email notifications"
            description="Order updates, messages, and marketplace alerts."
            action={<Toggle disabled />}
          />
          <Row
            icon={BellIcon}
            label="Offer alerts"
            description="Get notified when someone makes an offer on your listing."
            action={<Toggle disabled />}
          />
          <Row
            icon={DevicePhoneMobileIcon}
            label="SMS notifications"
            description={
              user?.phoneVerified
                ? "Transaction alerts sent to your verified number."
                : "Verify your phone in Edit Profile to enable."
            }
            action={user?.phoneVerified ? <Toggle disabled /> : <ComingSoonBadge />}
          />
        </Section>

        {/* Security */}
        <Section title="Security">
          <Row
            icon={EnvelopeIcon}
            label="Email address"
            description={user?.email ?? "—"}
            action={
              <ToggleBtn
                label={expanded === "email" ? "Cancel" : "Change"}
                onClick={() => toggle("email")}
              />
            }
          >
            {expanded === "email" && (
              <ChangeEmailForm
                currentEmail={user?.email ?? ""}
                onClose={() => setExpanded(null)}
              />
            )}
          </Row>

          <Row
            icon={KeyIcon}
            label="Password"
            description="Change your account password."
            action={
              <ToggleBtn
                label={expanded === "password" ? "Cancel" : "Change"}
                onClick={() => toggle("password")}
              />
            }
          >
            {expanded === "password" && (
              <ChangePasswordForm onClose={() => setExpanded(null)} />
            )}
          </Row>

          <Row
            icon={ShieldCheckIcon}
            label="Two-factor authentication"
            description="Add an extra layer of security to your account."
            action={<ComingSoonBadge />}
          />
        </Section>

        {/* Blocked users */}
        <BlockedUsersSection />

        {/* Danger zone */}
        <Section title="Danger Zone">
          <Row
            icon={TrashIcon}
            label="Delete account"
            description="Permanently remove your account and all your data."
            action={
              <button
                onClick={() => toggle("delete")}
                className="rounded-lg border border-ask/30 px-3 py-1.5 text-xs font-medium text-ask transition hover:bg-ask/10"
              >
                {expanded === "delete" ? "Cancel" : "Delete"}
              </button>
            }
          >
            {expanded === "delete" && (
              <DeleteAccountForm onClose={() => setExpanded(null)} />
            )}
          </Row>
        </Section>

      </div>
    </div>
  );
}

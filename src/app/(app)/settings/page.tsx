"use client";

import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  BellIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  KeyIcon,
  TrashIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

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
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface2">
        <Icon className="size-4 text-[#9A9A9A]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#F2F2F2]">{label}</p>
        <p className="mt-0.5 text-xs text-[#9A9A9A]">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
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
      aria-checked={false}
      role="switch"
    >
      <span className="inline-block size-4 translate-x-0.5 rounded-full bg-[#9A9A9A] shadow transition-transform" />
    </button>
  );
}

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();

  type ExtendedUser = NonNullable<typeof session>["user"] & {
    phone?: string | null;
    phoneVerified?: boolean;
  };
  const user = session?.user as ExtendedUser | undefined;

  async function handleChangePassword() {
    if (!user?.email) return;
    await authClient.requestPasswordReset({
      email: user.email,
      redirectTo: "/reset-password",
    });
    toast.success("Check your email for a password reset link.");
  }

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

      <div className="space-y-6">

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
                : "Verify your phone number in Edit Profile to enable."
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
            action={<ComingSoonBadge />}
          />
          <Row
            icon={KeyIcon}
            label="Password"
            description="Send a reset link to your email."
            action={
              <button
                onClick={handleChangePassword}
                className="rounded-lg border border-white/10 bg-surface2 px-3 py-1.5 text-xs font-medium text-[#F2F2F2] transition hover:border-white/20"
              >
                Change
              </button>
            }
          />
          <Row
            icon={ShieldCheckIcon}
            label="Two-factor authentication"
            description="Add an extra layer of security to your account."
            action={<ComingSoonBadge />}
          />
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone">
          <Row
            icon={TrashIcon}
            label="Delete account"
            description="Permanently remove your account and all your data."
            action={
              <button
                disabled
                className="rounded-lg border border-ask/20 px-3 py-1.5 text-xs font-medium text-ask opacity-40 cursor-not-allowed"
              >
                Delete
              </button>
            }
          />
        </Section>

      </div>
    </div>
  );
}

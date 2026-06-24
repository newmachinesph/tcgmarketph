"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { profileSetupSchema, type ProfileSetupInput } from "@/lib/validations/auth";
import { Button, Input, Field } from "@/components/ui";

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const letters =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);
  return <span className="text-2xl font-bold uppercase text-[#F2F2F2]">{letters}</span>;
}

export default function ProfileSetupPage() {
  const { data: session, isPending } = authClient.useSession();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      displayName: (session?.user as { displayName?: string })?.displayName ?? session?.user?.name ?? "",
      phone: "",
    },
  });

  const displayName = watch("displayName");

  const onSubmit = async (data: ProfileSetupInput) => {
    const { error } = await authClient.updateUser({
      displayName: data.displayName,
      ...(data.phone ? { phone: data.phone } : {}),
    } as Parameters<typeof authClient.updateUser>[0]);

    if (error) {
      setError("root", {
        message: error.message ?? "Could not save profile. Please try again.",
      });
    } else {
      toast.success("Profile saved!");
      setSaved(true);
      window.location.href = "/dashboard";
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4 py-12">
      <div className="w-full max-w-md">

        {/* Steps indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {["Account", "Profile", "Verify"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={[
                "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                i === 1
                  ? "bg-accent text-white"
                  : i < 1
                  ? "bg-bid/20 text-bid"
                  : "bg-surface border border-white/10 text-[#9A9A9A]",
              ].join(" ")}>
                {i < 1 ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === 1 ? "text-[#F2F2F2]" : "text-[#9A9A9A]"}`}>
                {step}
              </span>
              {i < 2 && <div className="h-px w-6 bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-8 shadow-2xl shadow-black/40">

          {/* Avatar preview */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-accent/10 border border-accent/20">
              {displayName ? (
                <Initials name={displayName} />
              ) : (
                <span className="text-2xl text-[#9A9A9A]">?</span>
              )}
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-[#F2F2F2]">
                {displayName || "Your Display Name"}
              </p>
              <p className="text-xs text-[#9A9A9A]">{session?.user?.email}</p>
            </div>
          </div>

          <h1 className="mb-1 text-center text-lg font-bold text-[#F2F2F2]">
            Set up your profile
          </h1>
          <p className="mb-6 text-center text-sm text-[#9A9A9A]">
            This is how other buyers and sellers will see you.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field
              label="Display Name"
              htmlFor="displayName"
              error={errors.displayName?.message}
            >
              <Input
                {...register("displayName")}
                id="displayName"
                type="text"
                placeholder="e.g. CardMaster_PH"
                autoComplete="nickname"
                aria-invalid={!!errors.displayName}
                aria-describedby={errors.displayName ? "displayName-error" : undefined}
              />
            </Field>

            <Field
              label="Mobile Number"
              htmlFor="phone"
              error={errors.phone?.message}
              hint={
                <span className="text-[10px] text-[#9A9A9A]">Optional · PH numbers only</span>
              }
            >
              <Input
                {...register("phone")}
                id="phone"
                type="tel"
                placeholder="09XXXXXXXXX"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
            </Field>

            {errors.root && (
              <p role="alert" className="rounded-lg border border-ask/20 bg-ask/10 px-3 py-2 text-xs text-ask">
                {errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              size="md"
              className="w-full justify-center"
              disabled={isSubmitting || saved}
            >
              {isSubmitting ? "Saving…" : "Save & Continue"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-[#9A9A9A]">
            You can update these anytime from your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
}

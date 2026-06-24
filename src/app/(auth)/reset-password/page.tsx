"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { Button, Input, Field } from "@/components/ui";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch("password", "");
  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!token) {
      setError("root", { message: "Invalid or expired reset link. Please request a new one." });
    }
  }, [token, setError]);

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) return;
    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token,
    });
    if (error) {
      setError("root", {
        message: error.message ?? "Could not reset password. The link may have expired.",
      });
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 shadow-2xl shadow-black/40 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <h2 className="text-base font-semibold text-[#F2F2F2]">Password updated</h2>
        <p className="mt-2 text-sm text-[#9A9A9A]">
          Your password has been reset. You can now sign in.
        </p>
        <Button
          size="md"
          className="mt-6 w-full justify-center"
          onClick={() => { window.location.href = "/login"; }}
        >
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-8 shadow-2xl shadow-black/40">
      <div className="mb-8 text-center">
        <a href="/" className="text-2xl font-extrabold tracking-tight text-accent">
          TCGMarket
        </a>
        <p className="mt-1 text-sm text-[#9A9A9A]">Choose a new password</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="New Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#F2F2F2] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2 flex gap-1 items-center">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : "bg-white/10"}`}
                />
              ))}
              <span className="ml-2 text-xs text-[#9A9A9A]">{strength.label}</span>
            </div>
          )}
        </Field>

        <Field label="Confirm Password" htmlFor="confirm" error={errors.confirm?.message}>
          <div className="relative">
            <Input
              {...register("confirm")}
              id="confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={!!errors.confirm}
              aria-describedby={errors.confirm ? "confirm-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#F2F2F2] transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
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
          disabled={isSubmitting || !token}
        >
          {isSubmitting ? "Saving…" : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-zA-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = [
    { label: "Weak",   color: "bg-ask" },
    { label: "Fair",   color: "bg-[#F5A623]" },
    { label: "Good",   color: "bg-[#F5A623]" },
    { label: "Strong", color: "bg-bid" },
  ];

  return { score, ...levels[Math.max(0, score - 1)] };
}

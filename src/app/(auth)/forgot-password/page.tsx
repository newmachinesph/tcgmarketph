"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { Button, Input, Field } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: "/reset-password",
    });
    if (error) {
      if (error.status === 429) {
        toast.error("Too many attempts. Please wait a minute and try again.");
      } else {
        setError("root", {
          message: error.message ?? "Something went wrong. Please try again.",
        });
      }
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 shadow-2xl shadow-black/40 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
        </div>
        <h2 className="text-base font-semibold text-[#F2F2F2]">Check your email</h2>
        <p className="mt-2 text-sm text-[#9A9A9A]">
          We sent a reset link to{" "}
          <span className="text-[#F2F2F2]">{getValues("email")}</span>.
          <br />
          It expires in 1 hour.
        </p>
        <p className="mt-6 text-xs text-[#9A9A9A]">
          Wrong address?{" "}
          <button
            onClick={() => setSent(false)}
            className="font-medium text-accent hover:underline"
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-8 shadow-2xl shadow-black/40">
      <div className="mb-8 text-center">
        <a href="/" className="text-2xl font-extrabold tracking-tight text-accent">
          TCGMarket
        </a>
        <p className="mt-1 text-sm text-[#9A9A9A]">Reset your password</p>
      </div>

      <p className="mb-5 text-xs text-[#9A9A9A]">
        Enter the email you signed up with and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            {...register("email")}
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-[#9A9A9A]">
        Remember it?{" "}
        <a href="/login" className="font-medium text-accent hover:underline">
          Sign In
        </a>
      </p>
    </div>
  );
}

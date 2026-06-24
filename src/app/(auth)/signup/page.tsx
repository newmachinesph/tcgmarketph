"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { Button, Input, Field } from "@/components/ui";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const hasGoogle = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch("password", "");
  const strength = getPasswordStrength(password);

  const onSubmit = async (data: SignupInput) => {
    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    if (error) {
      setError("root", {
        message: error.message ?? "Could not create account. Please try again.",
      });
    } else {
      window.location.href = "/dashboard";
    }
  };

  async function handleGoogle() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-8 shadow-2xl shadow-black/40">
      {/* Brand */}
      <div className="mb-8 text-center">
        <a href="/" className="text-2xl font-extrabold tracking-tight text-accent">
          TCGMarket
        </a>
        <p className="mt-1 text-sm text-[#9A9A9A]">Create your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Display Name" htmlFor="name" error={errors.name?.message}>
          <Input
            {...register("name")}
            id="name"
            type="text"
            placeholder="Ash Ketchum"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </Field>

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

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
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
              {showPassword ? (
                <EyeSlashIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          {/* Strength meter */}
          {password.length > 0 && (
            <div className="mt-2 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < strength.score
                      ? strength.color
                      : "bg-white/10"
                  }`}
                />
              ))}
              <span className="ml-2 text-xs text-[#9A9A9A]">{strength.label}</span>
            </div>
          )}
        </Field>

        <Field
          label="Confirm Password"
          htmlFor="confirm"
          error={errors.confirm?.message}
        >
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
              {showConfirm ? (
                <EyeSlashIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-[#9A9A9A]">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <Button
        variant="outline"
        size="md"
        className="w-full justify-center gap-2"
        onClick={handleGoogle}
        disabled={!hasGoogle}
        title={!hasGoogle ? "Google OAuth — add credentials to enable" : undefined}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-xs text-[#9A9A9A]">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-accent hover:underline">
          Sign In
        </a>
      </p>
    </div>
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

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

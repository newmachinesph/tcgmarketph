"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasGoogle = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const { error: authError } = await authClient.signIn.email({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      });
      if (authError) {
        setError(authError.message ?? "Invalid credentials. Please try again.");
      } else {
        window.location.href = "/dashboard";
      }
    });
  }

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
        <p className="mt-1 text-sm text-[#9A9A9A]">Sign in to your account</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-medium text-[#9A9A9A]">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium text-[#9A9A9A]">
              Password
            </label>
            <a
              href="/forgot-password"
              className="text-xs text-[#9A9A9A] hover:text-accent transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p className="rounded-lg border border-ask/20 bg-ask/10 px-3 py-2 text-xs text-ask">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="md"
          className="w-full justify-center"
          disabled={isPending}
        >
          {isPending ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-[#9A9A9A]">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Google */}
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
        Don&apos;t have an account?{" "}
        <a href="/signup" className="font-medium text-accent hover:underline">
          Sign Up
        </a>
      </p>
    </div>
  );
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

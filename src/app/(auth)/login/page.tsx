"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const { user, role, signInWithGoogle, isLoading, error, clearError } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const allowedDomain =
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ||
    process.env.ALLOWED_EMAIL_DOMAIN ||
    "aits.edu";

  useEffect(() => {
    if (user && !isLoading) {
      if (role === "admin") {
        router.replace("/admin/trips");
      } else if (role === "driver") {
        router.replace("/trip");
      } else {
        router.replace(from && from.startsWith("/dashboard") ? from : "/dashboard");
      }
    }
  }, [user, role, isLoading, from, router]);

  const handleGoogleSignIn = async () => {
    clearError();
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error is captured in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 17h.01M16 17h.01M9 11h6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zm0 0v2m14-2v2"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">College Bus Tracker</h1>
        <p className="text-xs text-muted-foreground">
          Sign in with your institutional Google account
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="font-semibold">Authentication Error</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-4 pt-2">
        <button
          type="button"
          disabled={submitting || isLoading}
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium shadow-sm transition hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{submitting ? "Signing in..." : "Continue with Google"}</span>
        </button>
      </div>

      <div className="space-y-1 rounded-xl bg-slate-50 p-4 text-xs text-muted-foreground dark:bg-slate-900/60">
        <p className="font-medium text-slate-700 dark:text-slate-300">
          Domain Restriction Notice:
        </p>
        <p>
          Only active accounts ending in{" "}
          <span className="font-semibold text-primary">@{allowedDomain}</span> are
          authorized to log in.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50/60 to-white p-4 dark:from-slate-950 dark:to-slate-900">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Loading sign-in portal...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

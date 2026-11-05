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
    <div className="relative w-full max-w-sm">
      {/* Decorative ambient background glow */}
      <div className="absolute -top-16 left-1/2 -z-10 h-48 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-400/10" />

      {/* Main minimal login card */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        {/* Brand header */}
        <div className="space-y-4 text-center">
          {/* Status pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-zinc-50/80 px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            AITS &bull; Transit Telemetry
          </div>

          {/* Minimalist logomark */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900/5 transition hover:scale-105 dark:bg-white dark:text-zinc-900">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.375c0-.621-.504-1.125-1.125-1.125H4.875c-.621 0-1.125.504-1.125 1.125v13.5m10.5-13.5v13.5m-10.5 0h10.5"
              />
            </svg>
          </div>

          {/* Title & minimal subtitle */}
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              College Bus Tracker
            </h1>
            <p className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
              Real-time fleet monitoring and live arrival ETAs
            </p>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/10 bg-red-50/60 p-3 text-[12px] text-red-600 dark:border-red-500/20 dark:bg-red-950/30 dark:text-red-400">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-7 space-y-4">
          <button
            type="button"
            disabled={submitting || isLoading}
            onClick={handleGoogleSignIn}
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-200/90 bg-white px-4 py-3 text-xs font-medium text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50/80 hover:shadow active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
          >
            {submitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
            )}
            <span className="tracking-tight">
              {submitting ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          {/* Minimalist domain badge */}
          <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
            <span>
              Restricted to accounts with{" "}
              <strong className="font-medium text-zinc-600 dark:text-zinc-300">
                @{allowedDomain}
              </strong>
            </span>
          </div>
        </div>

        {/* Minimal feature tags */}
        <div className="mt-8 border-t border-zinc-100 pt-5 dark:border-zinc-800/60">
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            <div className="rounded-xl bg-zinc-50/60 py-1.5 dark:bg-zinc-800/30">
              <span className="block font-medium text-zinc-700 dark:text-zinc-300">Live GPS</span>
              <span>4s telemetry</span>
            </div>
            <div className="rounded-xl bg-zinc-50/60 py-1.5 dark:bg-zinc-800/30">
              <span className="block font-medium text-zinc-700 dark:text-zinc-300">Road ETA</span>
              <span>OSRM engine</span>
            </div>
            <div className="rounded-xl bg-zinc-50/60 py-1.5 dark:bg-zinc-800/30">
              <span className="block font-medium text-zinc-700 dark:text-zinc-300">Alerts</span>
              <span>FCM push</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle institutional footer */}
      <p className="mt-6 text-center text-[11px] font-normal text-zinc-400 dark:text-zinc-600">
        Annamacharya Institute of Technology & Sciences
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50/60 p-4 font-sans selection:bg-zinc-900 selection:text-white dark:bg-zinc-950 dark:selection:bg-white dark:selection:text-zinc-900">
      {/* Subtle minimal geometric grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px]" />

      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white/50 p-8 text-center shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
            <p className="mt-3 text-xs text-zinc-400">Loading sign-in portal...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

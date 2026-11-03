import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50/50 to-white p-6 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
            <svg
              className="h-9 w-9"
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
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            AITS Bus Tracker
          </h1>
          <p className="text-sm text-muted-foreground">
            Official Real-Time College Transit & Route Monitoring
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-xs text-muted-foreground">
            Sign in with your official college email account (@aits.edu) to track your
            allocated bus, view real-time ETAs, and receive arrival alerts.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Sign In to Continue
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Open Live Dashboard
            </Link>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          College Bus Tracking System &bull; Next.js PWA &bull; OpenStreetMap
        </p>
      </div>
    </main>
  );
}

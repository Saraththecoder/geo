"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="mb-2 text-4xl font-extrabold text-primary">404</h1>
        <h2 className="mb-2 text-xl font-bold tracking-tight">Page Not Found</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          The page or tracking resource you are looking for does not exist or has been
          moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

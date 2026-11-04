"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, role, signOut } = useAuth();

  const getRoleBadge = (r: string | null) => {
    switch (r) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
      case "driver":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <svg
              className="h-5 w-5"
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
          <span className="hidden text-base tracking-tight sm:inline-block">
            AITS Bus Tracker
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${getRoleBadge(
                role
              )}`}
            >
              {role || "Student"}
            </span>

            <span className="hidden max-w-[150px] truncate text-xs text-muted-foreground md:inline-block">
              {user.email}
            </span>

            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-accent hover:text-accent-foreground"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow transition hover:bg-primary/90"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

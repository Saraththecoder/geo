"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";

const adminNavItems = [
  { href: "/admin/trips", label: "Trips & Delays", icon: "📊" },
  { href: "/admin/buses", label: "Buses", icon: "🚌" },
  { href: "/admin/drivers", label: "Drivers", icon: "👤" },
  { href: "/admin/routes", label: "Routes", icon: "🗺️" },
  { href: "/admin/stops", label: "Stops", icon: "📍" },
  { href: "/admin/students", label: "Student Allocation", icon: "👥" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950">
        <Navbar />
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4 rounded-2xl border bg-card p-8 shadow-sm">
            <h2 className="text-xl font-bold text-destructive">
              Admin Access Restricted
            </h2>
            <p className="text-xs text-muted-foreground">
              You do not have administrative permissions to view this section. Please sign
              in with an authorized administrator account.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Return to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950">
      <Navbar />

      {/* Admin Subnav */}
      <div className="border-b bg-card">
        <div className="no-scrollbar container flex gap-2 overflow-x-auto px-4 py-2 sm:px-8">
          {adminNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <main className="container flex-1 px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}

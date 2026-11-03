"use client";

import { Navbar } from "@/components/layout/Navbar";
import { DriverHUD } from "@/features/tracking/DriverHUD";

export default function DriverTripPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <DriverHUD />
      </main>
    </div>
  );
}

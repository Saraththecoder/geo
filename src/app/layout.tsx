import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ServiceWorkerRegister } from "@/components/providers/ServiceWorkerRegister";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

export const metadata: Metadata = {
  title: "AITS College Bus Tracker",
  description: "Production-ready, real-time college bus tracking and ETA PWA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BusTracker",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            <ServiceWorkerRegister />
            <OfflineBanner />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

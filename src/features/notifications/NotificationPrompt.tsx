"use client";

import { useState, useEffect } from "react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "@/lib/firebase/client";

export function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupportedBrowser, setIsSupportedBrowser] = useState<boolean>(false);
  const [requesting, setRequesting] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      isSupported()
        .then(setIsSupportedBrowser)
        .catch(() => setIsSupportedBrowser(false));
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!isSupportedBrowser) return;

    setRequesting(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === "granted") {
        const messaging = getMessaging(app);
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

        const currentToken = await getToken(messaging, {
          vapidKey: vapidKey || undefined,
        });

        if (currentToken) {
          // Register token with our backend
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: currentToken }),
          });
        }
      }
    } catch (err) {
      console.warn("FCM registration error:", err);
    } finally {
      setRequesting(false);
    }
  };

  // If already granted, denied, dismissed, or unsupported, hide prompt
  if (
    permission === "granted" ||
    permission === "denied" ||
    dismissed ||
    !isSupportedBrowser
  ) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold">Enable Arrival Push Notifications</p>
          <p className="mt-0.5 text-muted-foreground">
            Get an instant alert on your phone or desktop when your bus is ~5 minutes from
            your stop.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Later
        </button>
        <button
          type="button"
          disabled={requesting}
          onClick={handleEnableNotifications}
          className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
        >
          {requesting ? "Enabling..." : "Enable Alerts"}
        </button>
      </div>
    </div>
  );
}

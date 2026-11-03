import * as admin from "firebase-admin";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}

/**
 * Dispatches push notification and prunes stale/invalid tokens
 */
export async function sendPushAndPruneTokens(
  uid: string,
  tokens: string[],
  payload: PushPayload
): Promise<number> {
  if (!tokens || tokens.length === 0) return 0;

  const db = admin.firestore();
  const messaging = admin.messaging();

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      url: payload.url || "/dashboard",
      ...payload.data,
    },
    webpush: {
      notification: {
        icon: "/icons/icon.svg",
        badge: "/icons/icon.svg",
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    const staleTokens: string[] = [];

    response.responses.forEach((res, idx) => {
      if (!res.success && res.error) {
        const code = res.error.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token" ||
          code === "messaging/invalid-argument"
        ) {
          const badToken = tokens[idx];
          if (badToken) staleTokens.push(badToken);
        }
      }
    });

    // Prune stale tokens from Firestore user document
    if (staleTokens.length > 0) {
      console.info(`Pruning ${staleTokens.length} stale FCM tokens for user ${uid}`);
      await db.collection("users").doc(uid).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...staleTokens),
      });
    }

    return response.successCount;
  } catch (err) {
    console.warn(`Error sending FCM multicast to ${uid}:`, err);
    return 0;
  }
}


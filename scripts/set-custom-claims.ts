/**
 * CLI Script to assign custom claims and sync Firestore user role
 * Usage:
 *   npx ts-node scripts/set-custom-claims.ts <email-or-uid> <role> [busId] [stopId]
 * Roles: admin | driver | student
 */

import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID || "aits-bus";
const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  `https://${projectId}-default-rtdb.firebaseio.com`;

if (admin.apps.length === 0) {
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      databaseURL,
    });
  } else {
    admin.initializeApp({
      projectId,
      databaseURL,
    });
  }
}

const auth = admin.auth();
const db = admin.firestore();

async function setClaims() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: npx ts-node scripts/set-custom-claims.ts <email-or-uid> <role: admin|driver|student> [busId] [stopId]"
    );
    process.exit(1);
  }

  const [identifier, roleInput, busId, stopId] = args;
  const role = roleInput?.toLowerCase();

  if (!identifier || !role || !["admin", "driver", "student"].includes(role)) {
    console.error("Invalid role! Must be one of: 'admin', 'driver', 'student'.");
    process.exit(1);
  }

  try {
    // Resolve user by email or UID
    let userRecord: admin.auth.UserRecord;
    if (identifier.includes("@")) {
      userRecord = await auth.getUserByEmail(identifier);
    } else {
      userRecord = await auth.getUser(identifier);
    }

    const claims: Record<string, unknown> = { role };

    if (role === "driver" && busId) {
      claims.busId = busId;
    } else if (role === "student") {
      if (busId) claims.allocatedBusId = busId;
      if (stopId) claims.stopId = stopId;
    }

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, claims);
    console.info(`✓ Successfully assigned custom claims to ${userRecord.email} (${userRecord.uid}):`, claims);

    // Sync in Firestore users collection
    await db.collection("users").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || userRecord.email?.split("@")[0] || "User",
        role: role,
        allocatedBusId: busId || null,
        stopId: stopId || null,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    console.info(`✓ Updated Firestore document users/${userRecord.uid}`);
  } catch (err) {
    console.error("Error setting custom claims:", err);
    process.exit(1);
  }
}

setClaims();


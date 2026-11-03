import * as admin from "firebase-admin";

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "aits-bus";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  `https://${projectId}-default-rtdb.firebaseio.com`;

// Validate if private key is an actual PEM key (> 200 chars)
const isValidPemKey =
  rawPrivateKey &&
  rawPrivateKey.includes("BEGIN PRIVATE KEY") &&
  rawPrivateKey.length > 200;

function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    const existingApp = admin.apps[0];
    if (existingApp) return existingApp;
  }

  // If valid service account credentials are provided, use cert
  if (clientEmail && isValidPemKey) {
    try {
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: rawPrivateKey,
        }),
        databaseURL,
      });
    } catch (e) {
      console.warn(
        "Failed to initialize with cert credentials, falling back to project ID:",
        e
      );
    }
  }

  // Fallback for emulator / development / build time
  return admin.initializeApp({
    projectId,
    databaseURL,
  });
}

const adminApp = initializeFirebaseAdmin();
export const adminAuth = adminApp.auth();
export const adminFirestore = adminApp.firestore();
export const adminDatabase = adminApp.database();
export const adminMessaging = adminApp.messaging();
export default adminApp;

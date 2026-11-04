import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getDatabase, Database, connectDatabaseEmulator } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "aits-bus.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "aits-bus",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "aits-bus.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    "https://aits-bus-default-rtdb.firebaseio.com",
};

// Singleton Firebase Client instance
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);
rtdb = getDatabase(
  app,
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    "https://aitsbus-default-rtdb.asia-southeast1.firebasedatabase.app"
);

// Connect to local emulators if configured
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
if (useEmulator && typeof window !== "undefined") {
  // Check if emulators haven't been connected yet
  try {
    const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
    connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
  } catch {
    // Emulator already initialized
  }

  try {
    const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
    const [host, portStr] = firestoreHost.split(":");
    connectFirestoreEmulator(
      db,
      host || "127.0.0.1",
      portStr ? parseInt(portStr, 10) : 8080
    );
  } catch {
    // Emulator already initialized
  }

  try {
    const rtdbHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
    const [host, portStr] = rtdbHost.split(":");
    connectDatabaseEmulator(
      rtdb,
      host || "127.0.0.1",
      portStr ? parseInt(portStr, 10) : 9000
    );
  } catch {
    // Emulator already initialized
  }
}

export { app, auth, db, rtdb };

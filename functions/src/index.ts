import * as admin from "firebase-admin";

// Initialize admin once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export { onBusLocationUpdate } from "./triggers/onBusLocationUpdate";


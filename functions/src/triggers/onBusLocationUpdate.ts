import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { calculateDistanceMeters } from "../utils/geo";
import { sendPushAndPruneTokens } from "../utils/fcm";

const PROXIMITY_ALERT_METERS = 2000; // ~2 km / ~5 mins at 25-30 km/h

export const onBusLocationUpdate = functions.database
  .ref("/live/{busId}")
  .onWrite(async (change, context) => {
    const busId = context.params.busId;
    const before = change.before.exists() ? change.before.val() : null;
    const after = change.after.exists() ? change.after.val() : null;

    if (!after) return null; // Node was deleted

    const db = admin.firestore();

    // 1. Check for Trip Start Event
    const wasActive = before?.status === "active";
    const isNowActive = after.status === "active";

    if (!wasActive && isNowActive) {
      console.info(`Trip started for bus ${busId}`);
      try {
        const busDoc = await db.collection("buses").doc(busId).get();
        const busData = busDoc.data();
        const busNumber = busData?.number || busId;

        // Fetch students allocated to this bus
        const studentsSnap = await db
          .collection("users")
          .where("allocatedBusId", "==", busId)
          .where("role", "==", "student")
          .get();

        const promises = studentsSnap.docs.map(async (docSnap) => {
          const student = docSnap.data();
          if (student.fcmTokens && student.fcmTokens.length > 0) {
            await sendPushAndPruneTokens(docSnap.id, student.fcmTokens, {
              title: `Bus #${busNumber} Started Trip`,
              body: `Your bus has begun its route. Open your map to view live location & ETA.`,
              data: { busId, tripId: after.tripId || "" },
            });
          }
        });

        await Promise.all(promises);
      } catch (err) {
        console.error("Error sending trip start notifications:", err);
      }
      return null;
    }

    // 2. Proximity Notifications for Active Trips
    if (isNowActive && after.lat && after.lng && after.tripId) {
      const currentBusPos = { lat: after.lat, lng: after.lng };
      const tripId = after.tripId;

      try {
        const busDoc = await db.collection("buses").doc(busId).get();
        const busData = busDoc.data();
        if (!busData || !busData.routeId) return null;

        const routeDoc = await db.collection("routes").doc(busData.routeId).get();
        const routeData = routeDoc.data();
        if (!routeData || !routeData.stopIds) return null;

        // Fetch all stops
        const stopsSnap = await db.collection("stops").get();
        const stopMap = new Map();
        stopsSnap.docs.forEach((d) => stopMap.set(d.id, { id: d.id, ...d.data() }));

        // Check distance to each stop along route
        for (const stopId of routeData.stopIds) {
          const stop = stopMap.get(stopId);
          if (!stop) continue;

          const distanceMeters = calculateDistanceMeters(currentBusPos, {
            lat: stop.lat,
            lng: stop.lng,
          });

          // If bus is within proximity threshold
          if (distanceMeters <= PROXIMITY_ALERT_METERS) {
            // Find students waiting at this stop for this bus
            const studentsAtStopSnap = await db
              .collection("users")
              .where("allocatedBusId", "==", busId)
              .where("stopId", "==", stopId)
              .get();

            for (const studentDoc of studentsAtStopSnap.docs) {
              const studentId = studentDoc.id;
              const studentData = studentDoc.data();

              // Check idempotency: ensure notification sent ONLY ONCE per trip per student
              const notifRef = db
                .collection("trips")
                .doc(tripId)
                .collection("notificationsSent")
                .doc(studentId);

              const notifSnap = await notifRef.get();
              if (notifSnap.exists) {
                // Already notified for this trip! Skip.
                continue;
              }

              // Send FCM Push
              if (studentData.fcmTokens && studentData.fcmTokens.length > 0) {
                await sendPushAndPruneTokens(studentId, studentData.fcmTokens, {
                  title: `Bus #${busData.number} Arriving Soon!`,
                  body: `Bus #${busData.number} is approaching ${stop.name} (~5 min away).`,
                  data: {
                    busId,
                    tripId,
                    stopId,
                  },
                });

                // Mark sent
                await notifRef.set({
                  sentAt: Date.now(),
                  stopId,
                  distanceMeters,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Proximity evaluation error:", err);
      }
    }

    return null;
  });


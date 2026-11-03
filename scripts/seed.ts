/**
 * Database Seed Script for Local Emulator / Initial Cloud Setup
 * Populates sample stops, routes, buses, and demo user profiles
 * Usage: npx ts-node scripts/seed.ts
 */

import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID || "aits-bus";
const databaseURL =
  process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`;

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

const db = admin.firestore();

async function seed() {
  console.info("🌱 Starting College Bus Tracker data seeding...");

  // 1. Seed Stops
  const stops = [
    { id: "stop_main_gate", name: "Main Campus Entrance", lat: 13.0827, lng: 80.2707 },
    { id: "stop_library", name: "Central Library", lat: 13.0850, lng: 80.2740 },
    { id: "stop_tech_park", name: "Computer Science Block", lat: 13.0880, lng: 80.2780 },
    { id: "stop_hostel_junc", name: "Hostel Junction", lat: 13.0920, lng: 80.2820 },
    { id: "stop_sports_complex", name: "Sports Arena", lat: 13.0960, lng: 80.2860 },
    { id: "stop_metro", name: "Metro Station Transit Point", lat: 13.1000, lng: 80.2900 },
  ];

  for (const stop of stops) {
    await db.collection("stops").doc(stop.id).set(stop);
  }
  console.info(`✓ Seeded ${stops.length} transit stops`);

  // 2. Seed Routes
  const routes = [
    {
      id: "route_campus_express",
      name: "Campus Express Corridor",
      stopIds: ["stop_main_gate", "stop_library", "stop_tech_park", "stop_metro"],
      polyline: [
        [13.0827, 80.2707],
        [13.0850, 80.2740],
        [13.0880, 80.2780],
        [13.1000, 80.2900],
      ],
      isActive: true,
    },
    {
      id: "route_hostel_shuttle",
      name: "Hostel & Sports Complex Shuttle",
      stopIds: ["stop_main_gate", "stop_hostel_junc", "stop_sports_complex"],
      polyline: [
        [13.0827, 80.2707],
        [13.0920, 80.2820],
        [13.0960, 80.2860],
      ],
      isActive: true,
    },
  ];

  for (const route of routes) {
    await db.collection("routes").doc(route.id).set(route);
  }
  console.info(`✓ Seeded ${routes.length} transit routes`);

  // 3. Seed Buses
  const buses = [
    {
      id: "bus_12",
      number: "12",
      plate: "AP 04 TX 1234",
      capacity: 45,
      routeId: "route_campus_express",
      driverUid: "uid_driver_john",
      isActive: true,
    },
    {
      id: "bus_14",
      number: "14",
      plate: "AP 04 TX 5678",
      capacity: 50,
      routeId: "route_hostel_shuttle",
      driverUid: "uid_driver_sam",
      isActive: true,
    },
    {
      id: "bus_18",
      number: "18",
      plate: "AP 04 TX 9012",
      capacity: 40,
      routeId: "route_campus_express",
      driverUid: null,
      isActive: true,
    },
  ];

  for (const bus of buses) {
    await db.collection("buses").doc(bus.id).set(bus);
  }
  console.info(`✓ Seeded ${buses.length} fleet vehicles`);

  // 4. Seed Demo Users
  const users = [
    {
      uid: "uid_admin_demo",
      name: "College Transport Admin",
      email: "admin@aits.edu",
      role: "admin",
      allocatedBusId: null,
      stopId: null,
      fcmTokens: [],
    },
    {
      uid: "uid_driver_john",
      name: "John Driver",
      email: "driver.john@aits.edu",
      role: "driver",
      allocatedBusId: "bus_12",
      stopId: null,
      fcmTokens: [],
    },
    {
      uid: "uid_driver_sam",
      name: "Sam Driver",
      email: "driver.sam@aits.edu",
      role: "driver",
      allocatedBusId: "bus_14",
      stopId: null,
      fcmTokens: [],
    },
    {
      uid: "uid_student_rahul",
      name: "Rahul Sharma",
      email: "rahul.sharma@aits.edu",
      role: "student",
      allocatedBusId: "bus_12",
      stopId: "stop_library",
      fcmTokens: [],
    },
    {
      uid: "uid_student_priya",
      name: "Priya Patel",
      email: "priya.patel@aits.edu",
      role: "student",
      allocatedBusId: "bus_12",
      stopId: "stop_metro",
      fcmTokens: [],
    },
  ];

  for (const user of users) {
    await db.collection("users").doc(user.uid).set({
      ...user,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  console.info(`✓ Seeded ${users.length} user profiles`);

  console.info("🎉 Database seeding complete!");
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});


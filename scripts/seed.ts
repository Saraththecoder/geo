/**
 * Database Seed Script for Local Emulator / Initial Cloud Setup
 * Populates sample stops, routes, buses, and demo user profiles
 * Usage: npx ts-node scripts/seed.ts
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

const db = admin.firestore();

async function seed() {
  console.info("🌱 Starting College Bus Tracker data seeding...");

  // 1. Seed Stops (AITS Tirupati & City Corridor)
  const stops = [
    { id: "stop_bus_station", name: "Tirupati RTC Central Bus Station", lat: 13.6265, lng: 79.4277 },
    { id: "stop_railway_station", name: "Tirupati Railway Station", lat: 13.6288, lng: 79.4192 },
    { id: "stop_ramanuja_circle", name: "Ramanuja Circle", lat: 13.6335, lng: 79.4350 },
    { id: "stop_karakambadi", name: "Karakambadi Road Junction", lat: 13.6480, lng: 79.4650 },
    { id: "stop_sports_complex", name: "AITS Sports Ground", lat: 13.6635, lng: 79.4980 },
    { id: "stop_library", name: "Central Library (AITS)", lat: 13.6645, lng: 79.4990 },
    { id: "stop_tech_park", name: "Computer Science & Engineering Block", lat: 13.6648, lng: 79.4998 },
    { id: "stop_main_gate", name: "AITS Main Campus Entrance", lat: 13.6655, lng: 79.5005 },
    { id: "stop_hostel_junc", name: "AITS Student Hostel Block", lat: 13.6660, lng: 79.5015 },
    { id: "stop_metro", name: "Renigunta Railway Junction", lat: 13.6508, lng: 79.5165 },
  ];

  for (const stop of stops) {
    await db.collection("stops").doc(stop.id).set(stop);
  }
  console.info(`✓ Seeded ${stops.length} transit stops`);

  // 2. Seed Routes (AITS Tirupati Corridor)
  const routes = [
    {
      id: "route_campus_express",
      name: "Tirupati City to AITS Campus Corridor",
      stopIds: [
        "stop_bus_station",
        "stop_railway_station",
        "stop_ramanuja_circle",
        "stop_karakambadi",
        "stop_library",
        "stop_main_gate",
      ],
      polyline: [
        [13.6265, 79.4277],
        [13.6288, 79.4192],
        [13.6335, 79.4350],
        [13.6420, 79.4500],
        [13.6480, 79.4650],
        [13.6550, 79.4800],
        [13.6645, 79.4990],
        [13.6648, 79.4998],
        [13.6655, 79.5005],
      ],
      isActive: true,
    },
    {
      id: "route_hostel_shuttle",
      name: "AITS Hostel & Sports Shuttle",
      stopIds: ["stop_sports_complex", "stop_library", "stop_main_gate", "stop_hostel_junc"],
      polyline: [
        [13.6635, 79.4980],
        [13.6645, 79.4990],
        [13.6655, 79.5005],
        [13.6660, 79.5015],
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


# 🚌 College Bus Tracker PWA (AITS)

A production-grade, installable Progressive Web App (PWA) designed for real-time college bus fleet tracking, accurate road ETAs, proximity push notifications, and administrative fleet management.

Built for **Annamacharya Institute of Technology & Sciences (AITS)** with a strict multi-tier role model (**Student**, **Driver**, **Admin**), domain-restricted authentication (`@aits.edu`), battery-efficient GPS telemetry, and sub-second live map synchronisation.

---

## 📑 Table of Contents
- [Architecture & Data Flow](#-architecture--data-flow)
- [Role-Based Access Control](#-role-based-access-control)
- [Tech Stack](#-tech-stack)
- [Directory Structure](#-directory-structure)
- [Data Models & Security Rules](#-data-models--security-rules)
- [Key Engineering Implementations](#-key-engineering-implementations)
  - [Driver GPS Tracking & Smoothing](#1-driver-gps-tracking--telemetry-smoothing)
  - [Dual-Engine ETA Service](#2-dual-engine-eta-service-with-cache--fallback)
  - [Cloud Functions & Proximity Push Notifications](#3-cloud-functions--proximity-push-notifications)
  - [PWA Service Worker & Tile Caching](#4-progressive-web-app--tile-caching)
- [Environment Variables](#-environment-variables)
- [Local Development & Firebase Emulators](#-local-development--firebase-emulators)
- [Deployment Guide](#-deployment-guide)
- [Mobile Browser Limitations & Mitigations](#-mobile-browser-limitations--mitigations)
- [Testing & Quality Assurance](#-testing--quality-assurance)

---

## 🏛 Architecture & Data Flow

The platform deliberately splits operational data between **Firebase Realtime Database (RTDB)** and **Cloud Firestore**:
- **RTDB**: Dedicated solely to high-frequency ephemeral telemetry (`/live/{busId}`).
- **Firestore**: Houses relational, audited fleet entities (`users`, `buses`, `routes`, `stops`, `trips`).

```mermaid
flowchart TD
    subgraph DriverDevice["Driver Device (PWA)"]
        GPS[Geolocation Watcher] -->|Raw Lat/Lng/Speed| Filter[50m Accuracy Filter & Moving Average]
        Filter -->|Throttled (5-10s)| RTDB_Write[Write to /live/busId]
        WL[Screen Wake Lock API] -->|Prevents Standby| DriverHUD[Driver Telemetry HUD]
    end

    subgraph FirebaseCloud["Firebase Infrastructure"]
        RTDB[(Firebase Realtime DB\n/live/busId)]
        Firestore[(Cloud Firestore\nusers, buses, routes, stops, trips)]
        CF[Cloud Function:\nonBusLocationUpdate]
        FCM[Firebase Cloud Messaging]
    end

    subgraph StudentDevice["Student Device (PWA)"]
        RTDB -->|Realtime WebSocket Sync| StudentDashboard[Student Live Map]
        OSRM_API[OSRM ETA Engine & Fallback] -->|Cached Route ETAs| StudentDashboard
        FCM -->|Proximity & Start Push Alerts| PushSW[FCM Service Worker]
    end

    subgraph AdminConsole["Admin Console (Desktop/Tablet)"]
        AdminUI[Admin Dashboard] -->|Full CRUD & CSV Bulk Upload| Firestore
    end

    RTDB_Write --> RTDB
    RTDB --> CF
    CF -->|Read Student Stops & Tokens| Firestore
    CF -->|Check Proximity <= 2km| FCM
    CF -->|Record Idempotent Notification| Firestore
```

---

## 👥 Role-Based Access Control

All user accounts authenticate via Google Sign-In, strictly restricted to the official institutional domain (`@aits.edu` via `ALLOWED_EMAIL_DOMAIN`). User roles are embedded in **Firebase Custom Auth Claims** and protected both at the Edge ([`src/middleware.ts`](src/middleware.ts)) and in server-side API handlers.

| Role | Target Route | Capabilities & Boundaries |
| :--- | :--- | :--- |
| **Student** | `/dashboard` | • Live Leaflet map with smooth bus movement marker.<br>• Route path polyline and sequenced stops with highlighted **"My Stop"**.<br>• Real-time road ETA (OSRM API) with speed fallback.<br>• Telemetry status badge (*Live*, *Waiting*, *Trip Ended*) and 30s *Signal Lost* detector.<br>• Web push notifications when their bus starts a trip or is within 2 km. |
| **Driver** | `/trip` | • Bus selection from active college fleet.<br>• **Start Trip**: Generates audited trip record, activates high-accuracy GPS watcher, engages Screen Wake Lock.<br>• Real-time telemetry HUD: speed (km/h), heading, accuracy (m), and pings sent.<br>• **End Trip**: Releases wake lock, halts GPS stream, writes terminal status to `/live/{busId}`, and computes delay minutes. |
| **Admin** | `/admin/*` | • **Fleet CRUD**: Buses, Drivers, Routes, and Bus Stops with interactive lat/lng selection.<br>• **Bulk Allocation**: CSV parser and batch upload allocating students to buses and stops.<br>• **Trip History & Analytics**: Audited log of all completed trips with duration, delays, and stop timestamps. |

---

## 🛠 Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, `noImplicitAny`, zero `any`)
- **Styling & Components**: [Tailwind CSS](https://tailwindcss.com/) with accessible [shadcn/ui](https://ui.shadcn.com/) patterns
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth) with Google Provider & custom claims
- **Databases**:
  - [Firebase Realtime Database](https://firebase.google.com/docs/database) (live GPS coordinates only)
  - [Cloud Firestore](https://firebase.google.com/docs/firestore) (relational models, allocations, trips)
- **Mapping & Routing**:
  - [Leaflet](https://leafletjs.com/) & [react-leaflet](https://react-leaflet.js.org/) with OpenStreetMap raster tiles
  - [OSRM (Open Source Routing Machine)](http://project-osrm.org/) road navigation engine
- **PWA & Offline**: Custom Service Worker precaching app shell & caching OpenStreetMap tiles via Stale-While-Revalidate
- **Push Notifications**: [Firebase Cloud Messaging (FCM)](https://firebase.google.com/docs/cloud-messaging) with background service worker
- **Testing & Tooling**:
  - [Vitest](https://vitest.dev/) + React Testing Library (53 unit tests)
  - [Playwright](https://playwright.dev/) for E2E smoke verification
  - [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)

---

## 📂 Directory Structure

```
bus-tracker/
├─ firebase/                        # Firebase Security Rules & Indexes
│  ├─ database.rules.json           # Granular RTDB validation & write-rate limits
│  ├─ firestore.rules               # Role-based Firestore authorization
│  └─ firestore.indexes.json        # Composite indexes for trip queries
├─ functions/                       # Firebase Cloud Functions (Node.js 18)
│  ├─ src/
│  │  ├─ index.ts                   # Exported function endpoints
│  │  ├─ triggers/
│  │  │  └─ onBusLocationUpdate.ts  # Proximity detection & arrival push trigger
│  │  └─ utils/                     # FCM dispatch, token pruning & Haversine math
│  ├─ package.json
│  └─ tsconfig.json
├─ public/                          # PWA Assets & Service Workers
│  ├─ icons/                        # PWA icons (192x192, 512x512, maskable)
│  ├─ firebase-messaging-sw.js      # Background FCM push handler
│  └─ sw.js                         # Custom offline shell & OSM tile caching
├─ scripts/                         # Operational CLI Utilities
│  ├─ generate-icons.js             # PWA PNG icon generator
│  ├─ seed.ts                       # Emulator & DB demo dataset seeder
│  └─ set-custom-claims.ts          # CLI to assign student/driver/admin roles
├─ src/
│  ├─ app/
│  │  ├─ (admin)/admin/             # Admin console routes (buses, drivers, routes, stops, etc.)
│  │  ├─ (auth)/login/              # Institutional Google Sign-in page
│  │  ├─ (driver)/trip/             # Driver telemetry HUD & trip controls
│  │  ├─ (student)/dashboard/       # Student live map tracking & ETA dashboard
│  │  ├─ api/                       # Secured REST Route Handlers
│  │  │  ├─ allocations/            # CSV batch student allocation endpoint
│  │  │  ├─ auth/session/           # Session cookie issuer & claims sync
│  │  │  ├─ eta/                    # OSRM road ETA computation with speed fallback
│  │  │  ├─ notifications/          # FCM token registration & unregistration
│  │  │  └─ trips/                  # Trip start/end state transitions
│  │  ├─ error.tsx                  # Global error boundary
│  │  ├─ layout.tsx                 # Root layout (Fonts, Providers, ServiceWorker, OfflineBanner)
│  │  ├─ manifest.ts                # Dynamic Web App Manifest
│  │  └─ not-found.tsx              # 404 handler
│  ├─ components/
│  │  ├─ forms/                     # Zod-validated CRUD & CSV upload forms
│  │  ├─ layout/                    # Responsive Navbar & OfflineBanner
│  │  ├─ map/                       # Leaflet dynamic map, BusMarker, StopMarker, RoutePolyline
│  │  ├─ providers/                 # React Query & Service Worker providers
│  │  └─ ui/                        # Accessible UI primitives (Button, Card, Input, Table)
│  ├─ features/
│  │  ├─ admin/                     # CSV parser & allocation processors
│  │  ├─ auth/                      # AuthContext & domain-checking utilities
│  │  ├─ notifications/             # Notification permission prompt UI
│  │  └─ tracking/                  # Live bus badges, WakeLock warnings, HUD
│  ├─ hooks/                        # Custom React Hooks
│  │  ├─ useAuth.ts                 # Realtime auth state & claims
│  │  ├─ useGeolocationTracker.ts   # GPS watcher, filtering, smoothing & queue
│  │  ├─ useLiveBus.ts              # RTDB bus coordinate subscriber with 30s timeout
│  │  └─ useWakeLock.ts             # Screen Wake Lock controller
│  ├─ lib/                          # Core Libraries & Utilities
│  │  ├─ auth/domain.ts             # College email domain validation
│  │  ├─ eta/                       # OSRM Provider, Speed Fallback, and Cache
│  │  ├─ firebase/client.ts         # Firebase Web SDK singleton
│  │  ├─ firebase-admin/server.ts   # Firebase Admin SDK singleton
│  │  ├─ geo/                       # Distance calculations & moving average smoothing
│  │  └─ validation/schemas.ts      # Zod validation schemas for all entities
│  ├─ middleware.ts                 # Next.js Edge route guard & role redirection
│  └─ types/                        # Strict domain TypeScript types
├─ tests/
│  ├─ e2e/                          # Playwright smoke test suite
│  └─ unit/                         # 10 Vitest test suites (53 tests)
├─ .env.example                     # Environment template
├─ next.config.mjs                  # Security headers, CSP & Permissions-Policy
└─ tailwind.config.ts               # Custom styling tokens
```

---

## 🗄 Data Models & Security Rules

### 1. Firebase Realtime Database
Location: `/live/{busId}`
```typescript
interface LiveBusLocation {
  lat: number;        // Validated: -90 <= lat <= 90
  lng: number;        // Validated: -180 <= lng <= 180
  speed: number;      // km/h (speed >= 0)
  heading: number;    // Degrees (0 <= heading <= 360)
  accuracy: number;   // Accuracy in meters (accuracy >= 0)
  ts: number;         // Timestamp in ms
  tripId: string;     // Active trip ID
  driverUid: string;  // UID of assigned driver
  status: "active" | "ended";
}
```

#### Security Rules Enforcement ([`firebase/database.rules.json`](firebase/database.rules.json)):
- **Read**: Authenticated admins, assigned driver, or students allocated to this bus.
- **Write**: Only authenticated users with the `driver` claim whose UID matches `/live/{busId}/driverUid` or `newData.child('driverUid').val() === auth.uid`.
- **Validation**: Enforces numeric ranges and throttles writes (rejects pings faster than 1 ping / 3 seconds).

### 2. Cloud Firestore Collections
- **`users/{uid}`**: `{ role, name, email, allocatedBusId, stopId, fcmTokens: string[] }`
- **`buses/{busId}`**: `{ number, plate, capacity, routeId, driverUid }`
- **`routes/{routeId}`**: `{ name, stopIds: string[], polyline: [lat, lng][] }`
- **`stops/{stopId}`**: `{ name, lat, lng }`
- **`trips/{tripId}`**: `{ busId, driverUid, startedAt, endedAt, delayMinutes, stopsLog: [] }`
- **`trips/{tripId}/notificationsSent/{studentId}`**: Subcollection guaranteeing **once-per-trip** proximity notification idempotency.

---

## ⚙ Key Engineering Implementations

### 1. Driver GPS Tracking & Telemetry Smoothing
Located in [`src/hooks/useGeolocationTracker.ts`](src/hooks/useGeolocationTracker.ts):
- **Accuracy Filtering**: Pings with horizontal accuracy $> 50\text{ m}$ are discarded to prevent cellular tower drift.
- **Sliding-Window Smoothing**: A moving average window ($N = 3$) smooths minor jitter while preserving responsive turns.
- **Adaptive Throttling**: GPS points are batched and written to RTDB every $5\text{ seconds}$, saving mobile battery and Firebase bandwidth.
- **Offline Resiliency**: In transit dead-zones, coordinates are buffered in an in-memory queue and flushed upon network recovery.
- **Screen Wake Lock**: [`useWakeLock`](src/hooks/useWakeLock.ts) invokes `navigator.wakeLock.request('screen')` during active trips, with visibility-change listeners to immediately reacquire the lock if minimized.

### 2. Dual-Engine ETA Service with Cache & Fallback
Located in [`src/lib/eta/`](src/lib/eta/):
- **Primary Provider (`OsrmEtaProvider`)**: Queries OpenStreetMap's OSRM routing server with coordinate pairs (`lng,lat`). Computes exact road distance and turn-aware duration.
- **Fallback Provider (`SpeedFallbackEtaProvider`)**: If the OSRM service times out or fails, gracefully falls back to great-circle Haversine distance divided by the bus's rolling speed average (defaulting to a conservative $25\text{ km/h}$ in congested traffic).
- **In-Memory Cache**: Coordinates are rounded to 4 decimal places ($\sim 11\text{ m}$) with a $30\text{-second}$ TTL, preventing duplicate remote API calls from concurrent student views.

### 3. Cloud Functions & Proximity Push Notifications
Located in [`functions/src/triggers/onBusLocationUpdate.ts`](functions/src/triggers/onBusLocationUpdate.ts):
- Triggered on every RTDB write to `/live/{busId}` when `status == "active"`.
- Finds all students registered to the bus and their assigned bus stops.
- Computes real-time Haversine distance between the moving bus and each student's stop.
- When $\text{distance} \le 2000\text{ m}$, issues a personalized push notification:
  `"Bus arriving in ~5 min: Bus #X is approximately 1.8 km from your stop."`
- **Idempotency**: Writes to `trips/{tripId}/notificationsSent/{studentId}` so students never receive duplicate arrival spam during a single trip.
- **Token Pruning**: Automatically prunes stale/expired FCM registration tokens (`messaging/invalid-registration-token`, `messaging/registration-token-not-registered`).

### 4. Progressive Web App & Tile Caching
Located in [`public/sw.js`](public/sw.js) & [`src/app/manifest.ts`](src/app/manifest.ts):
- **Offline App Shell**: Pre-caches HTML skeleton, stylesheets, app manifests, and SVG markers.
- **Map Tile Caching**: Implements a **Stale-While-Revalidate** strategy specifically for `*.tile.openstreetmap.org/*` tiles, ensuring previously viewed map sectors render immediately without a network connection.
- **Connectivity Observer**: [`OfflineBanner`](src/components/layout/OfflineBanner.tsx) dynamically notifies users of offline state with automatic restoration toasts.

---

## 🔑 Environment Variables

Copy the template before launching:
```bash
cp .env.example .env.local
```

| Variable | Description | Where used |
| :--- | :--- | :--- |
| `ALLOWED_EMAIL_DOMAIN` | Institutional email domain (e.g. `aits.edu`) | Client & Server Auth check |
| `NEXT_PUBLIC_APP_URL` | Base public URL of the application | Client & Server metadata |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Client Web API Key | Client Browser SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`| Firebase Auth Domain | Client Browser SDK |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | Client Browser SDK |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Firebase Storage Bucket | Client Browser SDK |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`| FCM Sender ID | Client Browser SDK |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | Client Browser SDK |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL`| Realtime Database URL | Client RTDB listener |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY`| Web Push VAPID public key | Browser FCM registration |
| `FIREBASE_PROJECT_ID` | Google Cloud Project ID | Firebase Admin SDK (Server) |
| `FIREBASE_CLIENT_EMAIL` | Service Account Client Email | Firebase Admin SDK (Server) |
| `FIREBASE_PRIVATE_KEY` | Service Account PEM Private Key | Firebase Admin SDK (Server) |
| `NEXT_PUBLIC_OSRM_URL` | OSRM routing endpoint | ETA Service |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR`| Set `true` to connect client to local emulators | Local Dev |

---

## 💻 Local Development & Firebase Emulators

### Prerequisites
- Node.js 18.x or 20.x
- Java Runtime Environment (JRE 11+) for Firebase Local Emulators

### 1. Install Dependencies
```bash
npm install
cd functions && npm install && cd ..
```

### 2. Start Firebase Local Emulator Suite
In a dedicated terminal:
```bash
firebase emulators:start
```
The emulator UI will be available at [http://localhost:4000](http://localhost:4000) (Auth: `9099`, Firestore: `8080`, RTDB: `9000`, Functions: `5001`).

### 3. Seed Database with Realistic Fleet Data
Populate the emulator with test routes, stops, buses, driver accounts, and student allocations:
```bash
npx ts-node scripts/seed.ts
```

### 4. Assign Custom Claims
Promote test accounts to specific roles using the CLI utility:
```bash
# Assign Admin role
npx ts-node scripts/set-custom-claims.ts --uid <ADMIN_UID> --role admin

# Assign Driver role
npx ts-node scripts/set-custom-claims.ts --uid <DRIVER_UID> --role driver

# Assign Student role
npx ts-node scripts/set-custom-claims.ts --uid <STUDENT_UID> --role student
```

### 5. Run the Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment Guide

### Deploying to Vercel (Frontend & Serverless APIs)
1. Push your repository to GitHub or GitLab.
2. Import the project into the [Vercel Dashboard](https://vercel.com/).
3. Add all production environment variables from `.env.example` in **Project Settings > Environment Variables**.
   > **Note on `FIREBASE_PRIVATE_KEY`**: Ensure newline characters are escaped as `\n` or entered directly as a multiline string in Vercel.
4. Set Framework Preset to **Next.js**.
5. Trigger deployment.

### Deploying Firebase Rules & Cloud Functions
Login with the Firebase CLI and deploy security rules and triggers:
```bash
firebase login
firebase use <YOUR_FIREBASE_PROJECT_ID>

# Deploy Security Rules & Database Definitions
firebase deploy --only firestore:rules,database,firestore:indexes

# Deploy Proximity & Trip Notification Cloud Functions
firebase deploy --only functions
```

---

## 📱 Mobile Browser Limitations & Mitigations

| Operating System & Browser | Known Limitation | Mitigation Implemented |
| :--- | :--- | :--- |
| **iOS Safari & Android Chrome** | **Background GPS Throttling**: Mobile browsers aggressively throttle or terminate `navigator.geolocation.watchPosition` timers within 30-60 seconds of switching tabs or locking the device screen. | 1. **Screen Wake Lock API**: Automatically acquired upon "Start Trip" to keep driver screens continuously active.<br>2. **Persistent Warning Banner**: Displays an explicit alert on the driver HUD requiring the screen to stay awake.<br>3. **Visibility Change Re-acquisition**: If the driver switches away, returning immediately reclaims the wake lock.<br>4. **Offline Coordinate Queue**: Any unsent coordinates during brief sleep cycles are timestamped and dispatched upon resume. |
| **iOS Safari (PWA)** | **Web Push Requirements**: On iOS, Web Push via service workers is supported only on **iOS 16.4+** and **only after** the user has tapped "Add to Home Screen". | The app includes install prompt guidance instructing students to install the PWA to their home screen to enable push alerts. |
| **All Mobile Platforms** | **Aggressive Battery Optimizers**: Operating systems (e.g. MIUI, OneUI) throttle background WebSockets. | The student dashboard features a **30-second watchdog timer**: if no fresh telemetry arrives, the badge changes to an amber "Signal lost" alert, instructing the student to check route status. |

---

## 🧪 Testing & Quality Assurance

The codebase maintains strict quality thresholds with zero lint or typing bypasses:

```bash
# Run all unit tests (53 passing tests across 10 suites)
npm test

# Run tests with coverage report
npm run test:coverage

# TypeScript strict type-check (zero errors)
npm run typecheck

# ESLint inspection
npm run lint

# Prettier format check
npm run format:check

# Playwright E2E smoke tests
npx playwright test

# Next.js production build verification
npm run build
```

---

## 📜 License
Developed for educational transit operations at Annamacharya Institute of Technology & Sciences (AITS). All rights reserved.

#   g e o  
 
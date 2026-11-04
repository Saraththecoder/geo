import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebase-admin/server";
import { Bus, BusRoute, Stop } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Authenticate user from session cookie or Bearer token
  let token = request.cookies.get("__session")?.value;
  let isBearer = false;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split("Bearer ")[1];
    isBearer = true;
  }

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      },
      { status: 401 }
    );
  }

  try {
    const decoded = isBearer
      ? await adminAuth.verifyIdToken(token)
      : await adminAuth.verifySessionCookie(token, false);

    const uid = decoded.uid;

    // 2. Fetch student user profile by UID or email
    const userDoc = await adminFirestore.collection("users").doc(uid).get();
    let userData = userDoc.exists ? userDoc.data() : null;

    if (!userData && decoded.email) {
      const emailQuery = await adminFirestore
        .collection("users")
        .where("email", "==", decoded.email)
        .limit(1)
        .get();
      if (!emailQuery.empty) {
        userData = emailQuery.docs[0]?.data();
      }
    }

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "User profile not found" },
        },
        { status: 404 }
      );
    }
    const allocatedBusId = userData?.allocatedBusId;
    const stopId = userData?.stopId;

    if (!allocatedBusId) {
      return NextResponse.json({
        success: true,
        data: {
          allocated: false,
          bus: null,
          route: null,
          stops: [],
          myStopId: null,
        },
      });
    }

    // 3. Fetch Bus
    const busDoc = await adminFirestore.collection("buses").doc(allocatedBusId).get();
    if (!busDoc.exists) {
      return NextResponse.json({
        success: true,
        data: {
          allocated: false,
          bus: null,
          route: null,
          stops: [],
          myStopId: null,
        },
      });
    }

    const bus = { id: busDoc.id, ...busDoc.data() } as Bus;

    // 4. Fetch Route
    let route: BusRoute | null = null;
    if (bus.routeId) {
      const routeDoc = await adminFirestore.collection("routes").doc(bus.routeId).get();
      if (routeDoc.exists) {
        route = { id: routeDoc.id, ...routeDoc.data() } as BusRoute;
      }
    }

    // 5. Fetch Stops
    const stopsSnapshot = await adminFirestore.collection("stops").get();
    const stops: Stop[] = stopsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Stop[];

    return NextResponse.json(
      {
        success: true,
        data: {
          allocated: true,
          allocatedBusId,
          myStopId: stopId || null,
          bus,
          route,
          stops,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching student bus allocation:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error?.message || "Failed to load allocation data",
        },
      },
      { status: 500 }
    );
  }
}

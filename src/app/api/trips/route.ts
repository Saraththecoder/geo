import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore, adminDatabase } from "@/lib/firebase-admin/server";
import { z } from "zod";
import { Trip } from "@/types";

export const dynamic = "force-dynamic";

const startTripSchema = z.object({
  busId: z.string().min(1, "Bus ID is required"),
  routeId: z.string().min(1, "Route ID is required"),
});

const endTripSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
  busId: z.string().min(1, "Bus ID is required"),
  delayMinutes: z.number().int().default(0),
  stopsLog: z
    .array(
      z.object({
        stopId: z.string(),
        reachedAt: z.number(),
        scheduledAt: z.number().optional(),
      })
    )
    .default([]),
});

async function getAuthenticatedUser(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded;
  } catch {
    return null;
  }
}

// GET /api/trips?busId=...&driverUid=...&status=active
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const busId = searchParams.get("busId");
  const driverUid = searchParams.get("driverUid");
  const status = searchParams.get("status");

  try {
    let query: FirebaseFirestore.Query = adminFirestore.collection("trips");

    if (busId) {
      query = query.where("busId", "==", busId);
    }
    if (driverUid) {
      query = query.where("driverUid", "==", driverUid);
    }
    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.limit(50).get();
    const trips = snapshot.docs.map((doc) => doc.data() as Trip);

    return NextResponse.json({ success: true, data: trips });
  } catch (err: unknown) {
    console.error("GET /api/trips error:", err);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch trips" },
      },
      { status: 500 }
    );
  }
}

// POST /api/trips - Start Trip
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      },
      { status: 401 }
    );
  }

  // Ensure role is driver or admin
  const userRole = (user.role as string) || "student";
  if (userRole !== "driver" && userRole !== "admin") {
    return NextResponse.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Only drivers can start a trip" },
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = startTripSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid trip start parameters",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { busId, routeId } = parsed.data;

    // Verify bus exists
    const busDoc = await adminFirestore.collection("buses").doc(busId).get();
    if (!busDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Assigned bus not found" },
        },
        { status: 404 }
      );
    }

    // Check if there is already an active trip for this bus
    const activeTripQuery = await adminFirestore
      .collection("trips")
      .where("busId", "==", busId)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (!activeTripQuery.empty) {
      const existingTrip = activeTripQuery.docs[0]?.data() as Trip;
      return NextResponse.json({
        success: true,
        data: existingTrip,
        message: "Resuming existing active trip",
      });
    }

    // Create new Trip document
    const tripRef = adminFirestore.collection("trips").doc();
    const newTrip: Trip = {
      id: tripRef.id,
      busId,
      driverUid: user.uid,
      routeId,
      startedAt: Date.now(),
      status: "active",
      delayMinutes: 0,
      stopsLog: [],
    };

    await tripRef.set(newTrip);

    // Initialize RTDB /live/{busId} with active status
    await adminDatabase.ref(`live/${busId}`).update({
      tripId: tripRef.id,
      driverUid: user.uid,
      status: "active",
      ts: Date.now(),
    });

    return NextResponse.json({ success: true, data: newTrip }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/trips error:", err);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to start trip" },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/trips - End Trip
export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = endTripSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid trip end parameters",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { tripId, busId, delayMinutes, stopsLog } = parsed.data;

    const tripRef = adminFirestore.collection("trips").doc(tripId);
    const tripDoc = await tripRef.get();

    if (!tripDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Trip record not found" },
        },
        { status: 404 }
      );
    }

    const tripData = tripDoc.data() as Trip;

    // Verify that the caller is the driver who started the trip or an admin
    if (tripData.driverUid !== user.uid && user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not authorized to end this trip" },
        },
        { status: 403 }
      );
    }

    const endedAt = Date.now();
    await tripRef.update({
      endedAt,
      status: "ended",
      delayMinutes,
      stopsLog,
    });

    // Update RTDB /live/{busId} status to ended
    await adminDatabase.ref(`live/${busId}`).update({
      status: "ended",
      ts: endedAt,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...tripData,
        endedAt,
        status: "ended",
        delayMinutes,
        stopsLog,
      },
    });
  } catch (err: unknown) {
    console.error("PATCH /api/trips error:", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to end trip" } },
      { status: 500 }
    );
  }
}

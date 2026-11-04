import { NextRequest, NextResponse } from "next/server";
import { adminDatabase, adminAuth } from "@/lib/firebase-admin/server";
import { LiveBusLocation } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/telemetry/live?busId=bus_12
// Returns live telemetry directly from RTDB via Firebase Admin (bypasses any client WebSocket/CSP blocks)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const busId = searchParams.get("busId");

  if (!busId) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Missing busId parameter" } },
      { status: 400 }
    );
  }

  try {
    const snapshot = await adminDatabase.ref(`live/${busId}`).once("value");
    const data = snapshot.exists() ? (snapshot.val() as LiveBusLocation) : null;

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    console.error("GET /api/telemetry/live error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to read live telemetry" } },
      { status: 500 }
    );
  }
}

// POST /api/telemetry/live
// Fallback write to RTDB via Firebase Admin if client WebSockets are restricted
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : request.cookies.get("__session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(token).catch(async () => {
      return await adminAuth.verifySessionCookie(token, false);
    });

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid session" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { busId, location } = body as { busId: string; location: LiveBusLocation };

    if (!busId || !location) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Missing busId or location" } },
        { status: 400 }
      );
    }

    // Write to RTDB live/{busId}
    await adminDatabase.ref(`live/${busId}`).set(location);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("POST /api/telemetry/live error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to write live telemetry" } },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebase-admin/server";
import { parseStudentAllocationCsv } from "@/features/admin/csv-parser";
import { isAllowedCollegeEmail } from "@/lib/auth/domain";
import { Bus, Stop } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // 1. Authenticate Admin
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Admin authentication required" },
      },
      { status: 401 }
    );
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decodedToken.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only administrators can perform bulk allocations",
          },
        },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid session cookie" },
      },
      { status: 401 }
    );
  }

  try {
    // 2. Extract CSV string from request
    let csvText = "";
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (file && typeof file === "object" && "text" in file) {
        csvText = await (file as Blob).text();
      }
    } else {
      const body = await request.json();
      csvText = body?.csvText || "";
    }

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "Empty or missing CSV content" },
        },
        { status: 400 }
      );
    }

    // 3. Parse CSV
    const { validRows, errors: parseErrors } = parseStudentAllocationCsv(csvText);

    // 4. Load Buses and Stops dictionaries from Firestore for reference mapping
    const [busesSnap, stopsSnap] = await Promise.all([
      adminFirestore.collection("buses").get(),
      adminFirestore.collection("stops").get(),
    ]);

    const buses = busesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Bus[];
    const stops = stopsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Stop[];

    const busNumberToId = new Map<string, string>();
    buses.forEach((b) => busNumberToId.set(b.number.trim().toLowerCase(), b.id));

    const stopNameToId = new Map<string, string>();
    stops.forEach((s) => stopNameToId.set(s.name.trim().toLowerCase(), s.id));

    const rowErrors: Array<{ rowNumber?: number; email: string; error: string }> = [
      ...parseErrors.map((e) => ({
        rowNumber: e.rowNumber,
        email: e.email || "Unknown",
        error: e.error,
      })),
    ];

    let allocatedCount = 0;
    const batch = adminFirestore.batch();

    // 5. Process valid rows
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]!;
      const email = row.email.toLowerCase();

      // Check college domain
      if (!isAllowedCollegeEmail(email)) {
        rowErrors.push({
          rowNumber: i + 2,
          email,
          error: `Email domain is not permitted. Must end in @${process.env.ALLOWED_EMAIL_DOMAIN || "aits.edu"}`,
        });
        continue;
      }

      // Check Bus existence
      const busId = busNumberToId.get(row.busNumber.toLowerCase());
      if (!busId) {
        rowErrors.push({
          rowNumber: i + 2,
          email,
          error: `Bus #${row.busNumber} does not exist in vehicle registry.`,
        });
        continue;
      }

      // Check Stop existence
      const stopId = stopNameToId.get(row.stopName.toLowerCase());
      if (!stopId) {
        rowErrors.push({
          rowNumber: i + 2,
          email,
          error: `Stop "${row.stopName}" does not exist in stops registry.`,
        });
        continue;
      }

      // Resolve user by email or upsert placeholder document
      try {
        let uid: string;
        try {
          const authUser = await adminAuth.getUserByEmail(email);
          uid = authUser.uid;

          // Update Custom Claims
          await adminAuth.setCustomUserClaims(uid, {
            role: "student",
            allocatedBusId: busId,
            stopId: stopId,
          });
        } catch {
          // User has not logged in yet via Google; generate deterministic doc ID by email
          uid = Buffer.from(email).toString("base64url");
        }

        const userDocRef = adminFirestore.collection("users").doc(uid);
        batch.set(
          userDocRef,
          {
            uid,
            email,
            name: row.name,
            role: "student",
            allocatedBusId: busId,
            stopId: stopId,
            updatedAt: Date.now(),
          },
          { merge: true }
        );

        allocatedCount++;
      } catch (err: unknown) {
        rowErrors.push({
          rowNumber: i + 2,
          email,
          error: err instanceof Error ? err.message : "Failed to record allocation",
        });
      }
    }

    // Commit batch writes to Firestore
    if (allocatedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      data: {
        allocatedCount,
        errorCount: rowErrors.length,
        errors: rowErrors,
      },
    });
  } catch (err: unknown) {
    console.error("Bulk allocation processing error:", err);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to process student allocations" },
      },
      { status: 500 }
    );
  }
}

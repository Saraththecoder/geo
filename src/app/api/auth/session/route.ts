import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebase-admin/server";
import { isAllowedCollegeEmail } from "@/lib/auth/domain";
import { UserRole } from "@/types";

export const dynamic = "force-dynamic";

const SESSION_COOKIE_NAME = "__session";
const EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body?.idToken;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Missing idToken" } },
        { status: 400 }
      );
    }

    // Verify token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;

    // Enforce allowed email domain
    if (!isAllowedCollegeEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED_DOMAIN",
            message: `Access denied. You must use an official college email address (@${
              process.env.ALLOWED_EMAIL_DOMAIN || "aits.edu"
            }).`,
          },
        },
        { status: 403 }
      );
    }

    // Check or initialize user profile in Firestore
    const userRef = adminFirestore.collection("users").doc(decodedToken.uid);
    const userSnap = await userRef.get();

    let role: UserRole = "student";
    let allocatedBusId: string | null = null;
    let stopId: string | null = null;

    if (!userSnap.exists) {
      // First-time login: create student record
      await userRef.set({
        uid: decodedToken.uid,
        name: decodedToken.name || email?.split("@")[0] || "User",
        email: email,
        role: "student",
        allocatedBusId: null,
        stopId: null,
        fcmTokens: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Set initial custom claim
      await adminAuth.setCustomUserClaims(decodedToken.uid, {
        role: "student",
      });
    } else {
      const userData = userSnap.data();
      role = (userData?.role as UserRole) || "student";
      allocatedBusId = userData?.allocatedBusId || null;
      stopId = userData?.stopId || null;

      // Sync custom claims if not set
      if (decodedToken.role !== role || decodedToken.allocatedBusId !== allocatedBusId) {
        await adminAuth.setCustomUserClaims(decodedToken.uid, {
          role,
          allocatedBusId,
          stopId,
        });
      }
    }

    // Create Firebase session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: EXPIRES_IN_MS,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        uid: decodedToken.uid,
        email: email,
        role: role,
        allocatedBusId,
        stopId,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: EXPIRES_IN_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    // Also store role in a readable client cookie for fast UI rendering
    response.cookies.set("user_role", role, {
      maxAge: EXPIRES_IN_MS / 1000,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Session creation failed";
    console.error("Session verification error:", error);
    return NextResponse.json(
      { success: false, error: { code: "AUTH_ERROR", message } },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, data: { loggedOut: true } });
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete("user_role");
  return response;
}

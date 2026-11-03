import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebase-admin/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

export const dynamic = "force-dynamic";

const tokenSchema = z.object({
  token: z.string().min(10, "FCM registration token is required"),
});

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      },
      { status: 401 }
    );
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid session" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = tokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid token payload" },
        },
        { status: 400 }
      );
    }

    const { token } = parsed.data;

    // Add token to users/{uid}.fcmTokens array
    await adminFirestore
      .collection("users")
      .doc(uid)
      .update({
        fcmTokens: FieldValue.arrayUnion(token),
        updatedAt: Date.now(),
      });

    return NextResponse.json({
      success: true,
      data: { registered: true },
    });
  } catch (err: unknown) {
    console.error("FCM token registration error:", err);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to store notification token" },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      },
      { status: 401 }
    );
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid session" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const token = body?.token;
    if (token && typeof token === "string") {
      await adminFirestore
        .collection("users")
        .doc(uid)
        .update({
          fcmTokens: FieldValue.arrayRemove(token),
          updatedAt: Date.now(),
        });
    }

    return NextResponse.json({ success: true, data: { removed: true } });
  } catch (err: unknown) {
    console.error("FCM token removal error:", err);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to remove token" },
      },
      { status: 500 }
    );
  }
}

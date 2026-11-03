import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { etaService } from "@/lib/eta/service";

export const dynamic = "force-dynamic";

const etaQuerySchema = z.object({
  busLat: z.coerce.number().min(-90).max(90),
  busLng: z.coerce.number().min(-180).max(180),
  stopLat: z.coerce.number().min(-90).max(90),
  stopLng: z.coerce.number().min(-180).max(180),
  speed: z.coerce.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const queryParams = {
    busLat: searchParams.get("busLat"),
    busLng: searchParams.get("busLng"),
    stopLat: searchParams.get("stopLat"),
    stopLng: searchParams.get("stopLng"),
    speed: searchParams.get("speed") || undefined,
  };

  const parsed = etaQuerySchema.safeParse(queryParams);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid coordinates for ETA calculation",
          details: parsed.error.format(),
        },
      },
      { status: 400 }
    );
  }

  const { busLat, busLng, stopLat, stopLng, speed } = parsed.data;

  try {
    const origin = { lat: busLat, lng: busLng };
    const destination = { lat: stopLat, lng: stopLng };

    const result = await etaService.getEta(origin, destination, speed);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    console.error("GET /api/eta error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ETA_FAILED",
          message: "Failed to calculate ETA",
        },
      },
      { status: 500 }
    );
  }
}

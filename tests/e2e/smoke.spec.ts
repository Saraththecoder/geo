import { test, expect } from "@playwright/test";

test.describe("College Bus Tracker Smoke Suite", () => {
  test("unauthenticated visitor to /dashboard redirects to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // Should be redirected to /login with returnUrl query parameter
    await expect(page).toHaveURL(/\/login(\?returnUrl=.*)?/);
    await expect(
      page.getByRole("heading", { name: /College Bus Tracker/i }),
    ).toBeVisible();
    await expect(page.getByText(/@aits\.edu/i)).toBeVisible();
  });

  test("login page renders branding, domain warning, and sign-in action", async ({
    page,
  }) => {
    await page.goto("/login");

    // Check title and description
    await expect(
      page.getByRole("heading", { name: /College Bus Tracker/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Sign in with your official college account/i),
    ).toBeVisible();

    // Check Google sign-in button
    const signInButton = page.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();

    // Verify allowed domain notice is explicit
    await expect(
      page.getByText(/Only @aits\.edu accounts are authorized to sign in/i),
    ).toBeVisible();
  });

  test("PWA manifest is valid and serveable", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe("AITS College Bus Tracker");
    expect(manifest.short_name).toBe("AITS Bus");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    expect(manifest.icons[0].src).toContain("192x192");
  });

  test("Service worker script is accessible at /sw.js", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("aits-bus-v1");
  });

  test("ETA API endpoint validates query parameters strictly", async ({
    request,
  }) => {
    // Missing parameters should return 400 with structured validation errors
    const resBad = await request.get("/api/eta");
    expect(resBad.status()).toBe(400);
    const bodyBad = await resBad.json();
    expect(bodyBad.success).toBe(false);
    expect(bodyBad.error).toBeDefined();

    // Valid parameters should return 200 with calculated ETA
    const resGood = await request.get(
      "/api/eta?busLat=14.1950&busLng=79.1450&stopLat=14.2000&stopLng=79.1550&currentSpeed=25",
    );
    expect(resGood.status()).toBe(200);
    const bodyGood = await resGood.json();
    expect(bodyGood.success).toBe(true);
    expect(bodyGood.data.etaMinutes).toBeGreaterThanOrEqual(0);
    expect(bodyGood.data.distanceMeters).toBeGreaterThanOrEqual(0);
    expect(bodyGood.data.provider).toMatch(/osrm|speed-fallback/);
  });
});


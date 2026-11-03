import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";
import * as fs from "fs";
import * as path from "path";

describe("PWA Specification & Offline Configuration", () => {
  it("provides valid Web App Manifest compliant with PWA install criteria", () => {
    const config = manifest();

    expect(config.name).toBe("AITS College Bus Tracker");
    expect(config.short_name).toBe("BusTracker");
    expect(config.start_url).toBe("/dashboard");
    expect(config.display).toBe("standalone");
    expect(config.theme_color).toBe("#2563eb");
    expect(config.background_color).toBe("#ffffff");

    // Icons check
    expect(config.icons).toBeDefined();
    expect(config.icons?.length).toBeGreaterThanOrEqual(3);

    const has192 = config.icons?.some((i) => i.sizes === "192x192");
    const has512 = config.icons?.some((i) => i.sizes === "512x512");
    const hasMaskable = config.icons?.some((i) => i.purpose === "maskable");

    expect(has192).toBe(true);
    expect(has512).toBe(true);
    expect(hasMaskable).toBe(true);
  });

  it("verifies service worker file public/sw.js exists with offline caching rules", () => {
    const swPath = path.resolve(__dirname, "../../public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, "utf-8");
    expect(swContent).toContain("CACHE_NAME");
    expect(swContent).toContain("/offline.html");
    expect(swContent).toContain("tile.openstreetmap.org");
    expect(swContent).toContain("skipWaiting");
    expect(swContent).toContain("clients.claim");
  });

  it("verifies offline fallback shell public/offline.html is available", () => {
    const offlineHtmlPath = path.resolve(__dirname, "../../public/offline.html");
    expect(fs.existsSync(offlineHtmlPath)).toBe(true);

    const htmlContent = fs.readFileSync(offlineHtmlPath, "utf-8");
    expect(htmlContent).toContain("<!DOCTYPE html>");
    expect(htmlContent).toContain("You are offline");
    expect(htmlContent).toContain("Retry Connection");
  });

  it("verifies all PWA icon PNG binaries exist on disk with valid PNG header bytes", () => {
    const iconsDir = path.resolve(__dirname, "../../public/icons");
    const iconFiles = ["icon-192x192.png", "icon-512x512.png", "icon-maskable.png"];
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    for (const file of iconFiles) {
      const filePath = path.join(iconsDir, file);
      expect(fs.existsSync(filePath)).toBe(true);

      const buffer = fs.readFileSync(filePath);
      expect(buffer.subarray(0, 8)).toEqual(pngSignature);
    }
  });
});

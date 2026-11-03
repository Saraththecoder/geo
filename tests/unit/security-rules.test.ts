import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Firebase Realtime Database Security Rules", () => {
  const rtdbRulesPath = path.resolve(__dirname, "../../firebase/database.rules.json");
  const rawRules = fs.readFileSync(rtdbRulesPath, "utf-8");
  const rules = JSON.parse(rawRules);

  it("has valid JSON structure with root /live/{busId}", () => {
    expect(rules.rules).toBeDefined();
    expect(rules.rules.live).toBeDefined();
    expect(rules.rules.live["$busId"]).toBeDefined();
  });

  it("enforces role-based read permissions on /live/{busId}", () => {
    const readRule = rules.rules.live["$busId"][".read"];
    expect(readRule).toContain("auth != null");
    expect(readRule).toContain("auth.token.role === 'admin'");
    expect(readRule).toContain("auth.token.role === 'driver'");
    expect(readRule).toContain("auth.token.busId === $busId");
    expect(readRule).toContain("auth.token.role === 'student'");
    expect(readRule).toContain("auth.token.allocatedBusId === $busId");
  });

  it("enforces driver-only write permissions with matching driverUid", () => {
    const writeRule = rules.rules.live["$busId"][".write"];
    expect(writeRule).toContain("auth != null");
    expect(writeRule).toContain("auth.token.role === 'driver'");
    expect(writeRule).toContain("auth.token.busId === $busId");
    expect(writeRule).toContain("newData.child('driverUid').val() === auth.uid");
  });

  it("enforces write throttling (>= 4000ms) and payload schema", () => {
    const validateRule = rules.rules.live["$busId"][".validate"];
    expect(validateRule).toContain("hasChildren");
    expect(validateRule).toContain("lat");
    expect(validateRule).toContain("lng");
    expect(validateRule).toContain("speed");
    expect(validateRule).toContain("ts");
    // Throttling constraint
    expect(validateRule).toContain("newData.child('ts').val() - data.child('ts').val() >= 4000");
  });

  it("validates coordinate boundaries and disallows unknown fields", () => {
    const latValidate = rules.rules.live["$busId"].lat[".validate"];
    expect(latValidate).toContain(">= -90");
    expect(latValidate).toContain("<= 90");

    const lngValidate = rules.rules.live["$busId"].lng[".validate"];
    expect(lngValidate).toContain(">= -180");
    expect(lngValidate).toContain("<= 180");

    const otherValidate = rules.rules.live["$busId"]["$other"][".validate"];
    expect(otherValidate).toBe(false);
  });
});

describe("Firebase Firestore Security Rules", () => {
  const firestoreRulesPath = path.resolve(__dirname, "../../firebase/firestore.rules");
  const rawRules = fs.readFileSync(firestoreRulesPath, "utf-8");

  it("uses rules_version = '2'", () => {
    expect(rawRules).toContain("rules_version = '2';");
  });

  it("defines role helper functions", () => {
    expect(rawRules).toContain("function isAdmin()");
    expect(rawRules).toContain("function isDriver()");
    expect(rawRules).toContain("function isStudent()");
    expect(rawRules).toContain("function isOwner(uid)");
  });

  it("protects users collection from privilege escalation", () => {
    expect(rawRules).toContain("match /users/{uid}");
    // Checks that role and allocatedBusId cannot be modified by user
    expect(rawRules).toContain("!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'allocatedBusId'])");
  });

  it("protects trips collection so only assigned driver or admin can create/update", () => {
    expect(rawRules).toContain("match /trips/{tripId}");
    expect(rawRules).toContain("request.resource.data.driverUid == request.auth.uid");
  });

  it("restricts buses, routes, and stops modification to admin", () => {
    expect(rawRules).toContain("match /buses/{busId}");
    expect(rawRules).toContain("match /routes/{routeId}");
    expect(rawRules).toContain("match /stops/{stopId}");
  });
});

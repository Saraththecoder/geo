import { describe, it, expect } from "vitest";
import { isAllowedCollegeEmail } from "@/lib/auth/domain";

describe("Domain Validation & Role Checks", () => {
  const allowedDomain = "aits.edu";

  it("permits official college email addresses", () => {
    expect(isAllowedCollegeEmail("student@aits.edu", allowedDomain)).toBe(true);
    expect(isAllowedCollegeEmail("driver.john@aits.edu", allowedDomain)).toBe(true);
    expect(isAllowedCollegeEmail("admin@cse.aits.edu", allowedDomain)).toBe(true);
  });

  it("handles case-insensitivity and leading/trailing whitespace", () => {
    expect(isAllowedCollegeEmail("  Student123@AITS.EDU  ", allowedDomain)).toBe(true);
  });

  it("rejects unauthorized external personal domains", () => {
    expect(isAllowedCollegeEmail("user@gmail.com", allowedDomain)).toBe(false);
    expect(isAllowedCollegeEmail("user@yahoo.co.in", allowedDomain)).toBe(false);
    expect(isAllowedCollegeEmail("user@outlook.com", allowedDomain)).toBe(false);
    expect(isAllowedCollegeEmail("user@fake-aits.edu.org", allowedDomain)).toBe(false);
  });

  it("rejects malformed or empty inputs safely", () => {
    expect(isAllowedCollegeEmail("", allowedDomain)).toBe(false);
    expect(isAllowedCollegeEmail(null, allowedDomain)).toBe(false);
    expect(isAllowedCollegeEmail(undefined, allowedDomain)).toBe(false);
    expect(isAllowedCollegeEmail("not-an-email", allowedDomain)).toBe(false);
    expect(isAllowedCollegeEmail("aits.edu", allowedDomain)).toBe(false);
  });

  it("supports comma-delimited multiple domains", () => {
    const multiDomain = "aits.edu, alumni.aits.edu";
    expect(isAllowedCollegeEmail("test@alumni.aits.edu", multiDomain)).toBe(true);
    expect(isAllowedCollegeEmail("test@aits.edu", multiDomain)).toBe(true);
    expect(isAllowedCollegeEmail("test@other.edu", multiDomain)).toBe(false);
  });
});

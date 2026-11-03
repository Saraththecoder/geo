import { describe, it, expect } from "vitest";
import { parseStudentAllocationCsv } from "@/features/admin/csv-parser";

describe("Admin - Bulk Student Allocation CSV Parser", () => {
  it("parses valid CSV with standard headers accurately", () => {
    const csv = `email,name,busNumber,stopName
priya.patel@aits.edu,Priya Patel,12,Library
rahul.s@aits.edu,Rahul Sharma,14,Main Gate`;

    const result = parseStudentAllocationCsv(csv);
    expect(result.errors.length).toBe(0);
    expect(result.validRows.length).toBe(2);
    expect(result.validRows[0]).toEqual({
      email: "priya.patel@aits.edu",
      name: "Priya Patel",
      busNumber: "12",
      stopName: "Library",
    });
    expect(result.validRows[1]?.busNumber).toBe("14");
  });

  it("handles case-insensitive and variant header names", () => {
    const csv = `Email,Student Name,Bus No,Stop
vikram@aits.edu,Vikram Kumar,8,Hostel Junction`;

    const result = parseStudentAllocationCsv(csv);
    expect(result.validRows.length).toBe(1);
    expect(result.validRows[0]?.email).toBe("vikram@aits.edu");
    expect(result.validRows[0]?.busNumber).toBe("8");
  });

  it("identifies row-level validation errors for malformed or missing fields", () => {
    const csv = `email,name,busNumber,stopName
not-an-email,Test Student,12,Main Gate
valid@aits.edu,,14,Hostel
another@aits.edu,Good Student,,Library`;

    const result = parseStudentAllocationCsv(csv);
    expect(result.validRows.length).toBe(0);
    expect(result.errors.length).toBe(3);

    // Row 2 error (bad email)
    expect(result.errors[0]?.rowNumber).toBe(2);
    expect(result.errors[0]?.error).toContain("Invalid email");

    // Row 3 error (missing name)
    expect(result.errors[1]?.rowNumber).toBe(3);
    expect(result.errors[1]?.error).toContain("Student name is required");

    // Row 4 error (missing bus number)
    expect(result.errors[2]?.rowNumber).toBe(4);
    expect(result.errors[2]?.error).toContain("Bus number is required");
  });

  it("safely handles empty strings and blank lines", () => {
    const csv = `
    
email,name,busNumber,stopName

student1@aits.edu,Student One,10,Main Gate

`;
    const result = parseStudentAllocationCsv(csv);
    expect(result.validRows.length).toBe(1);
    expect(result.errors.length).toBe(0);
  });
});

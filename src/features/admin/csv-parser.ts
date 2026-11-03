import Papa from "papaparse";
import { studentCsvRowSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export type ValidatedStudentRow = z.infer<typeof studentCsvRowSchema>;

export interface CsvParseResult {
  validRows: ValidatedStudentRow[];
  errors: Array<{ rowNumber: number; email?: string; error: string }>;
  totalRows: number;
}

/**
 * Parses and validates CSV content for student bus allocations
 * Expected headers: email, name, busNumber, stopName
 */
export function parseStudentAllocationCsv(csvString: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvString.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const validRows: ValidatedStudentRow[] = [];
  const errors: Array<{ rowNumber: number; email?: string; error: string }> = [];

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2; // +1 for 1-based index, +1 for header row

    // Normalize keys (case-insensitive mapping)
    const normalizedRow: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z]/g, "");
      if (lowerKey === "email") normalizedRow.email = row[key]?.trim() || "";
      else if (lowerKey === "name" || lowerKey === "studentname")
        normalizedRow.name = row[key]?.trim() || "";
      else if (lowerKey === "bus" || lowerKey === "busnumber" || lowerKey === "busno")
        normalizedRow.busNumber = row[key]?.trim() || "";
      else if (lowerKey === "stop" || lowerKey === "stopname")
        normalizedRow.stopName = row[key]?.trim() || "";
    }

    const validation = studentCsvRowSchema.safeParse(normalizedRow);
    if (!validation.success) {
      const issueMsg = validation.error.issues.map((i) => i.message).join(", ");
      errors.push({
        rowNumber,
        email: normalizedRow.email || undefined,
        error: issueMsg,
      });
    } else {
      validRows.push(validation.data);
    }
  });

  return {
    validRows,
    errors,
    totalRows: parsed.data.length,
  };
}

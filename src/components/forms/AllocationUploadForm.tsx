"use client";

import { useState } from "react";
import {
  parseStudentAllocationCsv,
  ValidatedStudentRow,
} from "@/features/admin/csv-parser";

interface UploadResult {
  allocatedCount: number;
  errorCount: number;
  errors: Array<{ rowNumber?: number; email: string; error: string }>;
}

export function AllocationUploadForm({
  onAllocationComplete,
}: {
  onAllocationComplete?: () => void;
}) {
  const [csvContent, setCsvContent] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<ValidatedStudentRow[]>([]);
  const [parseErrors, setParseErrors] = useState<
    Array<{ rowNumber: number; email?: string; error: string }>
  >([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const sampleCsv = `email,name,busNumber,stopName
rahul.sharma@aits.edu,Rahul Sharma,12,Main Gate
priya.patel@aits.edu,Priya Patel,12,Library
anita.rao@aits.edu,Anita Rao,14,Hostel Junction
vikram.kumar@aits.edu,Vikram Kumar,14,Sports Complex`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "student_bus_allocation_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      const parsed = parseStudentAllocationCsv(text);
      setPreviewRows(parsed.validRows);
      setParseErrors(parsed.errors);
      setResult(null);
      setRequestError(null);
    };
    reader.readAsText(file);
  };

  const handleTextareaChange = (text: string) => {
    setCsvContent(text);
    if (text.trim().length > 0) {
      const parsed = parseStudentAllocationCsv(text);
      setPreviewRows(parsed.validRows);
      setParseErrors(parsed.errors);
    } else {
      setPreviewRows([]);
      setParseErrors([]);
    }
    setResult(null);
    setRequestError(null);
  };

  const handleUpload = async () => {
    if (!csvContent.trim()) return;

    setUploading(true);
    setRequestError(null);
    setResult(null);

    try {
      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: csvContent }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to process allocations");
      }

      setResult(json.data as UploadResult);
      if (onAllocationComplete) onAllocationComplete();
    } catch (err: unknown) {
      setRequestError(err instanceof Error ? err.message : "Error uploading CSV");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sample Template & Upload Instructions */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border bg-muted/40 p-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            CSV Format Specifications
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Columns required:{" "}
            <code className="rounded border bg-background px-1.5 py-0.5 text-primary">
              email
            </code>
            ,{" "}
            <code className="rounded border bg-background px-1.5 py-0.5 text-primary">
              name
            </code>
            ,{" "}
            <code className="rounded border bg-background px-1.5 py-0.5 text-primary">
              busNumber
            </code>
            ,{" "}
            <code className="rounded border bg-background px-1.5 py-0.5 text-primary">
              stopName
            </code>
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadSample}
          className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:bg-accent"
        >
          ⬇️ Download Sample CSV
        </button>
      </div>

      {requestError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          {requestError}
        </div>
      )}

      {/* Result feedback */}
      {result && (
        <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
              ✓
            </span>
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
              Bulk Allocation Completed
            </h4>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-400">
            Successfully allocated <strong>{result.allocatedCount} students</strong> to
            buses and stops.
            {result.errorCount > 0 && ` (${result.errorCount} row errors encountered)`}
          </p>

          {result.errors.length > 0 && (
            <div className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-destructive/30 bg-background/80 p-3">
              <p className="text-[11px] font-bold text-destructive">
                Encountered Issues:
              </p>
              {result.errors.map((e, idx) => (
                <p key={idx} className="text-[11px] text-muted-foreground">
                  Line {e.rowNumber || "?"} ({e.email}): {e.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File Dropzone & Text area */}
      <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-xs font-semibold">Upload CSV File</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="w-full cursor-pointer text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Or Paste CSV Text Directly
          </label>
          <textarea
            rows={5}
            value={csvContent}
            onChange={(e) => handleTextareaChange(e.target.value)}
            placeholder={sampleCsv}
            className="w-full rounded-xl border border-input bg-background p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Pre-flight Parse Preview */}
        {previewRows.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">
                Parsed Rows Preview ({previewRows.length} valid rows)
              </p>
              {parseErrors.length > 0 && (
                <span className="text-xs font-semibold text-destructive">
                  {parseErrors.length} parsing errors
                </span>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-2.5 font-semibold">Email</th>
                    <th className="p-2.5 font-semibold">Name</th>
                    <th className="p-2.5 font-semibold">Bus #</th>
                    <th className="p-2.5 font-semibold">Stop</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewRows.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="p-2.5 text-foreground">{row.email}</td>
                      <td className="p-2.5">{row.name}</td>
                      <td className="p-2.5 font-semibold text-primary">
                        {row.busNumber}
                      </td>
                      <td className="p-2.5">{row.stopName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewRows.length > 10 && (
                <p className="bg-muted/20 p-2 text-center text-[11px] text-muted-foreground">
                  Showing first 10 of {previewRows.length} rows
                </p>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={uploading || previewRows.length === 0}
          onClick={handleUpload}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
        >
          {uploading
            ? "Assigning Students & Syncing Claims..."
            : `Apply ${previewRows.length} Student Allocations`}
        </button>
      </div>
    </div>
  );
}

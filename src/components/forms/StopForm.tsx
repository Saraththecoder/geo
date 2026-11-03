"use client";

import { useState } from "react";
import { Stop } from "@/types";
import { stopSchema } from "@/lib/validation/schemas";

interface StopFormProps {
  initialData?: Stop | null;
  onSave: (stop: Stop) => Promise<void>;
  onCancel: () => void;
}

export function StopForm({ initialData, onSave, onCancel }: StopFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [lat, setLat] = useState(initialData?.lat ? String(initialData.lat) : "");
  const [lng, setLng] = useState(initialData?.lng ? String(initialData.lng) : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const stopPayload = {
      id: initialData?.id || `stop_${Date.now()}`,
      name: name.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };

    const validation = stopSchema.safeParse(stopPayload);
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join(", "));
      return;
    }

    setSubmitting(true);
    try {
      await onSave(stopPayload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save stop");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold">Stop Name</label>
        <input
          type="text"
          required
          placeholder="e.g. Main Gate / Library"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">Latitude (-90 to 90)</label>
          <input
            type="number"
            step="0.000001"
            required
            placeholder="e.g. 13.0827"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Longitude (-180 to 180)
          </label>
          <input
            type="number"
            step="0.000001"
            required
            placeholder="e.g. 80.2707"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Saving..." : initialData ? "Update Stop" : "Add Stop"}
        </button>
      </div>
    </form>
  );
}

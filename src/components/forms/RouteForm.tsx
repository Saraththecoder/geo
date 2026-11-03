"use client";

import { useState } from "react";
import { BusRoute, Stop } from "@/types";
import { routeSchema } from "@/lib/validation/schemas";

interface RouteFormProps {
  initialData?: BusRoute | null;
  availableStops: Stop[];
  onSave: (route: BusRoute) => Promise<void>;
  onCancel: () => void;
}

export function RouteForm({
  initialData,
  availableStops,
  onSave,
  onCancel,
}: RouteFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [selectedStopIds, setSelectedStopIds] = useState<string[]>(
    initialData?.stopIds || (availableStops[0] ? [availableStops[0].id] : [])
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAddStop = (stopId: string) => {
    if (!stopId) return;
    setSelectedStopIds((prev) => [...prev, stopId]);
  };

  const handleRemoveStop = (index: number) => {
    setSelectedStopIds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveStop = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === selectedStopIds.length - 1)
    ) {
      return;
    }
    const newIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...selectedStopIds];
    const temp = updated[index]!;
    updated[index] = updated[newIdx]!;
    updated[newIdx] = temp;
    setSelectedStopIds(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Compute polyline from the selected stop coordinates
    const stopMap = new Map(availableStops.map((s) => [s.id, s]));
    const polyline: [number, number][] = [];
    selectedStopIds.forEach((sid) => {
      const stop = stopMap.get(sid);
      if (stop) polyline.push([stop.lat, stop.lng]);
    });

    const routePayload = {
      id: initialData?.id || `route_${Date.now()}`,
      name: name.trim(),
      stopIds: selectedStopIds,
      polyline,
      isActive,
    };

    const validation = routeSchema.safeParse(routePayload);
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join(", "));
      return;
    }

    setSubmitting(true);
    try {
      await onSave(routePayload as BusRoute);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save route");
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
        <label className="mb-1 block text-xs font-semibold">Route Name</label>
        <input
          type="text"
          required
          placeholder="e.g. Route 4 - Railway Station to Campus"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
        />
      </div>

      {/* Sequenced Stops List */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-xs font-semibold">
            Route Stops Sequence ({selectedStopIds.length} stops)
          </label>
          {availableStops.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddStop(e.target.value);
                  e.target.value = "";
                }
              }}
              defaultValue=""
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs font-medium"
            >
              <option value="" disabled>
                + Add Stop to Route
              </option>
              {availableStops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedStopIds.length === 0 ? (
          <p className="rounded-xl border bg-muted/20 p-3 text-center text-xs text-muted-foreground">
            No stops added yet. Select stops to add to this route.
          </p>
        ) : (
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {selectedStopIds.map((stopId, idx) => {
              const stop = availableStops.find((s) => s.id === stopId);
              return (
                <div
                  key={`${stopId}-${idx}`}
                  className="flex items-center justify-between rounded-lg border bg-card p-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-foreground">
                      {stop?.name || "Unknown Stop"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStop(idx, "up")}
                      className="rounded p-1 hover:bg-muted disabled:opacity-30"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedStopIds.length - 1}
                      onClick={() => handleMoveStop(idx, "down")}
                      className="rounded p-1 hover:bg-muted disabled:opacity-30"
                      title="Move down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(idx)}
                      className="ml-1 rounded p-1 text-destructive hover:bg-destructive/10"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="isRouteActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-input text-primary"
        />
        <label htmlFor="isRouteActive" className="cursor-pointer text-xs font-medium">
          Active route
        </label>
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
          disabled={submitting || selectedStopIds.length === 0}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Saving..." : initialData ? "Update Route" : "Create Route"}
        </button>
      </div>
    </form>
  );
}

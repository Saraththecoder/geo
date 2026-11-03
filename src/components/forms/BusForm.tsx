"use client";

import { useState } from "react";
import { Bus, BusRoute, UserProfile } from "@/types";
import { busSchema } from "@/lib/validation/schemas";

interface BusFormProps {
  initialData?: Bus | null;
  routes: BusRoute[];
  drivers: UserProfile[];
  onSave: (bus: Bus) => Promise<void>;
  onCancel: () => void;
}

export function BusForm({
  initialData,
  routes,
  drivers,
  onSave,
  onCancel,
}: BusFormProps) {
  const [number, setNumber] = useState(initialData?.number || "");
  const [plate, setPlate] = useState(initialData?.plate || "");
  const [capacity, setCapacity] = useState(
    initialData?.capacity ? String(initialData.capacity) : "40"
  );
  const [routeId, setRouteId] = useState(initialData?.routeId || routes[0]?.id || "");
  const [driverUid, setDriverUid] = useState(initialData?.driverUid || "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const busPayload = {
      id: initialData?.id || `bus_${Date.now()}`,
      number: number.trim(),
      plate: plate.trim().toUpperCase(),
      capacity: parseInt(capacity, 10),
      routeId,
      driverUid: driverUid || null,
      isActive,
    };

    const validation = busSchema.safeParse(busPayload);
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join(", "));
      return;
    }

    setSubmitting(true);
    try {
      await onSave(busPayload as Bus);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save bus record");
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">Bus Number</label>
          <input
            type="text"
            required
            placeholder="e.g. 12"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">License Plate</label>
          <input
            type="text"
            required
            placeholder="e.g. AP 04 TX 1234"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm uppercase shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">Seating Capacity</label>
          <input
            type="number"
            min="1"
            max="120"
            required
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Assigned Route</label>
          <select
            required
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Assigned Driver (Optional)
        </label>
        <select
          value={driverUid}
          onChange={(e) => setDriverUid(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
        >
          <option value="">Unassigned</option>
          {drivers.map((d) => (
            <option key={d.uid} value={d.uid}>
              {d.name} ({d.email})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-input text-primary"
        />
        <label htmlFor="isActive" className="cursor-pointer text-xs font-medium">
          Active in fleet service
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
          disabled={submitting}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Saving..." : initialData ? "Update Bus" : "Add Bus"}
        </button>
      </div>
    </form>
  );
}

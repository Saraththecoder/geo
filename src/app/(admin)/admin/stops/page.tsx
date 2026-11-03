"use client";

import { useEffect, useState } from "react";
import { Stop } from "@/types";
import { StopForm } from "@/components/forms/StopForm";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function AdminStopsPage() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStop, setEditingStop] = useState<Stop | null | "new">(null);

  const loadStops = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "stops"));
      setStops(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Stop[]);
    } catch (err) {
      console.error("Error loading stops:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStops();
  }, []);

  const handleSave = async (stop: Stop) => {
    await setDoc(doc(db, "stops", stop.id), stop, { merge: true });
    setEditingStop(null);
    await loadStops();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this stop?")) return;
    await deleteDoc(doc(db, "stops", id));
    await loadStops();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Transit Stops Directory</h1>
          <p className="text-xs text-muted-foreground">
            Manage designated pick-up and drop-off coordinates across college transit
            corridors
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingStop("new")}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          + Add New Stop
        </button>
      </div>

      {editingStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-base font-bold">
              {editingStop === "new"
                ? "Create New Bus Stop"
                : `Edit Stop: ${editingStop.name}`}
            </h2>
            <StopForm
              initialData={editingStop === "new" ? null : editingStop}
              onSave={handleSave}
              onCancel={() => setEditingStop(null)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : stops.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-xs text-muted-foreground">
          No stops defined yet. Click &quot;Add New Stop&quot; to establish transit
          points.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 font-semibold">Stop Name</th>
                <th className="p-3 font-semibold">Latitude</th>
                <th className="p-3 font-semibold">Longitude</th>
                <th className="p-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stops.map((stop) => (
                <tr key={stop.id} className="hover:bg-muted/20">
                  <td className="flex items-center gap-2 p-3 font-semibold text-foreground">
                    <span>📍</span> {stop.name}
                  </td>
                  <td className="p-3 font-mono">{stop.lat.toFixed(6)}</td>
                  <td className="p-3 font-mono">{stop.lng.toFixed(6)}</td>
                  <td className="space-x-2 p-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingStop(stop)}
                      className="font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(stop.id)}
                      className="font-medium text-destructive hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { BusRoute, Stop } from "@/types";
import { RouteForm } from "@/components/forms/RouteForm";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoute, setEditingRoute] = useState<BusRoute | null | "new">(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routeSnap, stopSnap] = await Promise.all([
        getDocs(collection(db, "routes")),
        getDocs(collection(db, "stops")),
      ]);

      setRoutes(routeSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as BusRoute[]);
      setStops(stopSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Stop[]);
    } catch (err) {
      console.error("Error loading routes data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (route: BusRoute) => {
    await setDoc(doc(db, "routes", route.id), route, { merge: true });
    setEditingRoute(null);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;
    await deleteDoc(doc(db, "routes", id));
    await loadData();
  };

  const stopMap = new Map(stops.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Transit Routes</h1>
          <p className="text-xs text-muted-foreground">
            Configure transit paths, stops sequencing, and geometric polylines
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingRoute("new")}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          + Create Route
        </button>
      </div>

      {editingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-base font-bold">
              {editingRoute === "new"
                ? "Create New Bus Route"
                : `Edit Route: ${editingRoute.name}`}
            </h2>
            <RouteForm
              initialData={editingRoute === "new" ? null : editingRoute}
              availableStops={stops}
              onSave={handleSave}
              onCancel={() => setEditingRoute(null)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : routes.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-xs text-muted-foreground">
          No routes defined yet. Click &quot;Create Route&quot; to build a transit path.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 font-semibold">Route Name</th>
                <th className="p-3 font-semibold">Stops Count</th>
                <th className="p-3 font-semibold">Stops Sequence</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {routes.map((route) => (
                <tr key={route.id} className="hover:bg-muted/20">
                  <td className="p-3 font-bold text-foreground">{route.name}</td>
                  <td className="p-3 font-medium">{route.stopIds.length} stops</td>
                  <td className="max-w-xs truncate p-3 text-muted-foreground">
                    {route.stopIds.map((sid) => stopMap.get(sid) || "Stop").join(" → ")}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        route.isActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {route.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="space-x-2 p-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingRoute(route)}
                      className="font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(route.id)}
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

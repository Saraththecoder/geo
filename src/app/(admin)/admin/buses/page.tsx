"use client";

import { useEffect, useState } from "react";
import { Bus, BusRoute, UserProfile } from "@/types";
import { BusForm } from "@/components/forms/BusForm";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function AdminBusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBus, setEditingBus] = useState<Bus | null | "new">(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [busSnap, routeSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "buses")),
        getDocs(collection(db, "routes")),
        getDocs(collection(db, "users")),
      ]);

      setBuses(busSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Bus[]);
      setRoutes(routeSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as BusRoute[]);
      setDrivers(
        usersSnap.docs
          .map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)
          .filter((u) => u.role === "driver")
      );
    } catch (err) {
      console.error("Error loading bus fleet:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (bus: Bus) => {
    const busRef = doc(db, "buses", bus.id);
    await setDoc(busRef, bus, { merge: true });
    setEditingBus(null);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bus?")) return;
    await deleteDoc(doc(db, "buses", id));
    await loadData();
  };

  const routeMap = new Map(routes.map((r) => [r.id, r.name]));
  const driverMap = new Map(drivers.map((d) => [d.uid, d.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Bus Fleet Management</h1>
          <p className="text-xs text-muted-foreground">
            Manage college transit vehicles, capacities, and driver assignments
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingBus("new")}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          + Add New Bus
        </button>
      </div>

      {editingBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-base font-bold">
              {editingBus === "new"
                ? "Register New Fleet Bus"
                : `Edit Bus #${editingBus.number}`}
            </h2>
            <BusForm
              initialData={editingBus === "new" ? null : editingBus}
              routes={routes}
              drivers={drivers}
              onSave={handleSave}
              onCancel={() => setEditingBus(null)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : buses.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-xs text-muted-foreground">
          No buses registered in fleet yet. Click &quot;Add New Bus&quot; to register a
          vehicle.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 font-semibold">Bus #</th>
                <th className="p-3 font-semibold">License Plate</th>
                <th className="p-3 font-semibold">Capacity</th>
                <th className="p-3 font-semibold">Assigned Route</th>
                <th className="p-3 font-semibold">Assigned Driver</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {buses.map((bus) => (
                <tr key={bus.id} className="hover:bg-muted/20">
                  <td className="p-3 font-bold text-primary">#{bus.number}</td>
                  <td className="p-3 font-mono font-medium">{bus.plate}</td>
                  <td className="p-3">{bus.capacity} seats</td>
                  <td className="p-3">{routeMap.get(bus.routeId) || "—"}</td>
                  <td className="p-3">
                    {bus.driverUid
                      ? driverMap.get(bus.driverUid) || "Driver"
                      : "Unassigned"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        bus.isActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {bus.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="space-x-2 p-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingBus(bus)}
                      className="font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(bus.id)}
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

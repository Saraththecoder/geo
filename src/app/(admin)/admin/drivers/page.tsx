"use client";

import { useEffect, useState } from "react";
import { UserProfile, Bus } from "@/types";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUid, setSavingUid] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersSnap, busesSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "buses")),
      ]);

      const driverUsers = usersSnap.docs
        .map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)
        .filter((u) => u.role === "driver");

      setDrivers(driverUsers);
      setBuses(busesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Bus[]);
    } catch (err) {
      console.error("Error loading drivers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignBus = async (driverUid: string, busId: string) => {
    setSavingUid(driverUid);
    try {
      // 1. Update user document
      await updateDoc(doc(db, "users", driverUid), {
        allocatedBusId: busId || null,
        updatedAt: Date.now(),
      });

      // 2. Also update bus document's driverUid
      if (busId) {
        await updateDoc(doc(db, "buses", busId), {
          driverUid: driverUid,
        });
      }
      await loadData();
    } catch (err) {
      console.error("Error assigning driver to bus:", err);
    } finally {
      setSavingUid(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Driver Roster &amp; Vehicle Pairing
        </h1>
        <p className="text-xs text-muted-foreground">
          View certified college transit drivers and assign primary operating vehicles
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-xs text-muted-foreground">
          No driver profiles registered. To designate a user as a driver, assign the
          driver custom claim via CLI script:
          <code className="mt-2 block rounded-xl bg-muted p-2 font-mono text-primary">
            npx tsx scripts/set-custom-claims.ts &lt;driver-email&gt; driver [busId]
          </code>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 font-semibold">Driver Name</th>
                <th className="p-3 font-semibold">Institutional Email</th>
                <th className="p-3 font-semibold">Assigned Vehicle</th>
                <th className="p-3 font-semibold">Pairing Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {drivers.map((driver) => {
                const assignedBus = buses.find(
                  (b) => b.driverUid === driver.uid || b.id === driver.allocatedBusId
                );
                return (
                  <tr key={driver.uid} className="hover:bg-muted/20">
                    <td className="p-3 font-bold text-foreground">{driver.name}</td>
                    <td className="p-3 text-muted-foreground">{driver.email}</td>
                    <td className="p-3">
                      {assignedBus ? (
                        <span className="font-semibold text-primary">
                          Bus #{assignedBus.number} ({assignedBus.plate})
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground">
                          None Assigned
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        disabled={savingUid === driver.uid}
                        value={assignedBus?.id || ""}
                        onChange={(e) => handleAssignBus(driver.uid, e.target.value)}
                        className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium"
                      >
                        <option value="">Unassigned</option>
                        {buses.map((b) => (
                          <option key={b.id} value={b.id}>
                            Bus #{b.number} ({b.plate})
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

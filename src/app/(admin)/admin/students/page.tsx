"use client";

import { useEffect, useState } from "react";
import { UserProfile, Bus, Stop } from "@/types";
import { AllocationUploadForm } from "@/components/forms/AllocationUploadForm";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersSnap, busesSnap, stopsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "buses")),
        getDocs(collection(db, "stops")),
      ]);

      const studentList = usersSnap.docs
        .map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)
        .filter((u) => u.role === "student");

      setStudents(studentList);
      setBuses(busesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Bus[]);
      setStops(stopsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Stop[]);
    } catch (err) {
      console.error("Error loading students list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const busMap = new Map(buses.map((b) => [b.id, b.number]));
  const stopMap = new Map(stops.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Bulk Student Bus Allocation</h1>
        <p className="text-xs text-muted-foreground">
          Upload official student CSV files to bulk assign buses, routes, and designated
          stops
        </p>
      </div>

      {/* Upload Component */}
      <AllocationUploadForm onAllocationComplete={loadData} />

      {/* Existing Allocations Directory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight">
            Current Student Allocations ({students.length} students)
          </h2>
          <button
            type="button"
            onClick={loadData}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-xs text-muted-foreground">
            No students allocated yet. Upload a CSV file above to assign students.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 font-semibold">Student Name</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Allocated Bus</th>
                  <th className="p-3 font-semibold">Designated Stop</th>
                  <th className="p-3 font-semibold">Push Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student) => {
                  const busNumber = student.allocatedBusId
                    ? busMap.get(student.allocatedBusId)
                    : null;
                  const stopName = student.stopId ? stopMap.get(student.stopId) : null;

                  return (
                    <tr key={student.uid} className="hover:bg-muted/20">
                      <td className="p-3 font-bold text-foreground">{student.name}</td>
                      <td className="p-3 text-muted-foreground">{student.email}</td>
                      <td className="p-3">
                        {busNumber ? (
                          <span className="font-semibold text-primary">
                            Bus #{busNumber}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3">
                        {stopName ? (
                          <span>📍 {stopName}</span>
                        ) : (
                          <span className="italic text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {student.fcmTokens?.length
                          ? `${student.fcmTokens.length} active device(s)`
                          : "None registered"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

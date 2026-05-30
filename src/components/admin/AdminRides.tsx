"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, RIDE_STATUS_LABELS } from "@/lib/utils";
import { useRideRealtime } from "@/hooks/useRideRealtime";
import { MapPin, Navigation } from "lucide-react";

interface RideRow {
  id: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedFare: number;
  finalFare: number | null;
  paymentMethod: string;
  paymentStatus: string;
  cancelReason: string | null;
  createdAt: string;
  completedAt: string | null;
  rider: { id: string; name: string; email: string };
  driver: { id: string; name: string; email: string } | null;
}

function AdminRidesContent() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") as "active" | "completed" | "cancelled") || "active";
  const [filter, setFilter] = useState<"active" | "completed" | "cancelled">(initialFilter);
  const [rides, setRides] = useState<RideRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRides = useCallback(async () => {
    setLoading(true);
    const { data } = await api<{ rides: RideRow[] }>(`/api/admin/rides?filter=${filter}`);
    if (data) setRides(data.rides);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  useRideRealtime({
    onUpdate: loadRides,
    events: ["ride:requested", "ride:accepted", "ride:status", "ride:completed", "ride:location"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ride management</h1>
        <p className="text-slate-400">Track active, completed, and cancelled trips</p>
      </div>

      <div className="flex gap-2">
        {(["active", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              filter === f ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-400"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400">Loading rides...</p>
      ) : rides.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-400">
            No {filter} trips.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => (
            <Card key={ride.id}>
              <CardContent className="py-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium">
                    {RIDE_STATUS_LABELS[ride.status] || ride.status}
                  </span>
                  <span className="font-semibold text-sky-400">
                    {formatCurrency(ride.finalFare ?? ride.estimatedFare)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                    {ride.pickupAddress}
                  </p>
                  <p className="flex items-start gap-2">
                    <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    {ride.destinationAddress}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Rider: {ride.rider.name}</span>
                  <span>Driver: {ride.driver?.name ?? "Unassigned"}</span>
                  <span>{formatDate(ride.createdAt)}</span>
                  {ride.completedAt && <span>Completed: {formatDate(ride.completedAt)}</span>}
                  <span>{ride.paymentMethod} · {ride.paymentStatus}</span>
                  {ride.cancelReason && <span className="text-red-400">Reason: {ride.cancelReason}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminRides() {
  return (
    <Suspense fallback={<p className="text-slate-400">Loading...</p>}>
      <AdminRidesContent />
    </Suspense>
  );
}

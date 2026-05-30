"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, RIDE_STATUS_LABELS } from "@/lib/utils";
import { Star } from "lucide-react";

interface Ride {
  id: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedFare: number;
  finalFare: number | null;
  createdAt: string;
  rating: number | null;
  driver?: { name: string };
}

export function RideHistoryList() {
  const [tab, setTab] = useState<"completed" | "cancelled">("completed");
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    async function load() {
      const status = tab === "completed" ? "COMPLETED" : "CANCELLED";
      const { data } = await api<{ rides: Ride[] }>(`/api/rides?status=${status}`);
      if (data) setRides(data.rides);
    }
    load();
  }, [tab]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Ride history</h1>
      <div className="mb-6 flex gap-2">
        {(["completed", "cancelled"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {rides.length === 0 && (
          <p className="text-slate-400">No {tab} trips yet.</p>
        )}
        {rides.map((ride) => (
          <Link key={ride.id} href={`/rider/tracking/${ride.id}`}>
            <Card className="transition hover:border-sky-500/50">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{ride.destinationAddress}</p>
                  <p className="text-sm text-slate-400">
                    {formatDate(ride.createdAt)} · {RIDE_STATUS_LABELS[ride.status]}
                  </p>
                  {ride.driver && (
                    <p className="text-sm text-slate-500">Driver: {ride.driver.name}</p>
                  )}
                  {tab === "completed" && ride.rating && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-amber-400">
                      <Star className="h-3 w-3 fill-current" /> {ride.rating}/5
                    </p>
                  )}
                  {tab === "completed" && !ride.rating && ride.driver && (
                    <p className="mt-1 text-xs text-amber-400/80">Rate your driver →</p>
                  )}
                </div>
                <p className="font-semibold text-sky-400">
                  {formatCurrency(ride.finalFare ?? ride.estimatedFare)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

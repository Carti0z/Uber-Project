"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, RIDE_STATUS_LABELS } from "@/lib/utils";
import { useRideRealtime } from "@/hooks/useRideRealtime";
import { Car, Clock, MapPin, Star } from "lucide-react";

interface RideSummary {
  id: string;
  status: string;
  destinationAddress: string;
  estimatedFare: number;
  finalFare: number | null;
  createdAt: string;
  rating: number | null;
}

export function RiderHome() {
  const router = useRouter();
  const [activeRide, setActiveRide] = useState<RideSummary | null>(null);
  const [recentRides, setRecentRides] = useState<RideSummary[]>([]);
  const [stats, setStats] = useState({ completed: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await api<{ rides: RideSummary[] }>("/api/rides");
    if (!data) {
      setLoading(false);
      return;
    }

    const active = data.rides.find((r) =>
      ["REQUESTED", "DRIVER_ASSIGNED", "DRIVER_ARRIVING", "IN_PROGRESS"].includes(r.status)
    );
    setActiveRide(active || null);

    const completed = data.rides.filter((r) => r.status === "COMPLETED");
    setRecentRides(data.rides.slice(0, 3));
    setStats({
      completed: completed.length,
      totalSpent: completed.reduce(
        (s, r) => s + (r.finalFare ?? r.estimatedFare),
        0
      ),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRideRealtime({
    onUpdate: load,
    events: ["ride:accepted", "ride:status", "ride:completed"],
  });

  if (loading) return <p className="text-slate-400">Loading...</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Where to?</h1>
          <p className="mt-1 text-slate-400">Your Movee rider home</p>
        </div>
        <Link href="/rider/book">
          <Button size="lg">
            <Car className="h-5 w-5" /> Book a ride
          </Button>
        </Link>
      </div>

      {activeRide && (
        <Card className="border-sky-500/40 bg-sky-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <p className="text-sm font-medium text-sky-400">Active trip</p>
              <p className="font-semibold">{activeRide.destinationAddress}</p>
              <p className="text-sm text-slate-400">
                {RIDE_STATUS_LABELS[activeRide.status]}
              </p>
            </div>
            <Button onClick={() => router.push(`/rider/tracking/${activeRide.id}`)}>
              Track ride
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-slate-400">Trips completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-slate-400">Total spent</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-slate-400">Quick action</p>
            <Link href="/rider/history" className="text-lg font-semibold text-sky-400 hover:underline">
              View history →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent trips</h2>
          <Link href="/rider/history" className="text-sm text-sky-400 hover:underline">
            See all
          </Link>
        </div>
        {recentRides.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-slate-400">
              <MapPin className="mx-auto mb-3 h-8 w-8 opacity-50" />
              No trips yet. Book your first ride!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentRides.map((ride) => (
              <Link key={ride.id} href={`/rider/tracking/${ride.id}`}>
                <Card className="transition hover:border-sky-500/40">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{ride.destinationAddress}</p>
                      <p className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(ride.createdAt)} · {RIDE_STATUS_LABELS[ride.status]}
                      </p>
                      {ride.rating && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-amber-400">
                          <Star className="h-3 w-3 fill-current" /> {ride.rating}/5
                        </p>
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
        )}
      </div>
    </div>
  );
}

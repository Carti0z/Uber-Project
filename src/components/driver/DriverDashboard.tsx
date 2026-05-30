"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RideMap } from "@/components/map/RideMap";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { FlowSteps } from "@/components/ui/FlowSteps";
import { api } from "@/lib/api";
import { splitFare } from "@/lib/fare";
import {
  formatCurrency,
  RIDE_STATUS_LABELS,
  DRIVER_FLOW_STEPS,
  driverFlowStep,
} from "@/lib/utils";
import { useRideRealtime } from "@/hooks/useRideRealtime";
import { Bell, MapPin, Navigation, Power, User } from "lucide-react";

interface ActiveRide {
  id: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  estimatedFare: number;
  etaMinutes: number | null;
  tripProgress: number;
  driverLat: number | null;
  driverLng: number | null;
  rider: { name: string; phone: string | null };
}

interface DriverProfile {
  isOnline: boolean;
  currentLat: number | null;
  currentLng: number | null;
}

const DEFAULT_LOC = { lat: 40.7128, lng: -74.006 };

export function DriverDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastEarning, setLastEarning] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const [profileRes, requestsRes, earningsRes] = await Promise.all([
      api<{ profile: DriverProfile }>("/api/driver/profile"),
      api<{ requests: unknown[]; activeRide: ActiveRide | null }>("/api/driver/requests"),
      api<{ rides: { finalFare: number | null; estimatedFare: number }[] }>(
        "/api/driver/earnings?period=daily"
      ),
    ]);
    if (profileRes.data) setProfile(profileRes.data.profile);
    if (requestsRes.data) {
      setPendingCount(requestsRes.data.requests.length);
      setActiveRide(requestsRes.data.activeRide);
    }
    if (earningsRes.data?.rides[0]) {
      const r = earningsRes.data.rides[0];
      setLastEarning(r.finalFare ?? r.estimatedFare);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRideRealtime({
    onUpdate: fetchData,
    rideId: activeRide?.id,
    events: ["ride:requested", "ride:status", "ride:location", "ride:completed"],
  });

  useEffect(() => {
    if (!profile?.isOnline) return;
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      await api("/api/driver/profile", {
        method: "PATCH",
        body: JSON.stringify({
          currentLat: pos.coords.latitude,
          currentLng: pos.coords.longitude,
        }),
      });
    });
  }, [profile?.isOnline]);

  async function toggleOnline() {
    const newStatus = !profile?.isOnline;
    await api("/api/driver/profile", {
      method: "PATCH",
      body: JSON.stringify({
        isOnline: newStatus,
        currentLat: DEFAULT_LOC.lat,
        currentLng: DEFAULT_LOC.lng,
      }),
    });
    fetchData();
  }

  async function rideAction(action: string) {
    if (!activeRide) return;
    const loc = profile?.currentLat
      ? { driverLat: profile.currentLat, driverLng: profile.currentLng }
      : {};
    const { data } = await api<{ ride: ActiveRide }>(`/api/rides/${activeRide.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action, ...loc }),
    });
    if (action === "complete" && data?.ride) {
      router.push("/driver/earnings");
      return;
    }
    fetchData();
  }

  const flowStep = driverFlowStep(
    !!profile?.isOnline,
    !!activeRide,
    activeRide?.status
  );

  if (loading) return <p className="text-slate-400">Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Driver dashboard</h1>
          <p className="text-slate-400">
            {profile?.isOnline ? "You are online and ready" : "You are offline"}
          </p>
        </div>
        <Button
          variant={profile?.isOnline ? "danger" : "primary"}
          onClick={toggleOnline}
          size="lg"
        >
          <Power className="h-5 w-5" />
          {profile?.isOnline ? "Go offline" : "Go online"}
        </Button>
      </div>

      <FlowSteps steps={DRIVER_FLOW_STEPS} currentStep={flowStep} />

      {activeRide ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">
                Active ride · {RIDE_STATUS_LABELS[activeRide.status]}
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-green-400" />
                <div>
                  <p className="text-xs text-slate-500">Pickup</p>
                  <p className="text-sm">{activeRide.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="mt-0.5 h-4 w-4 text-red-400" />
                <div>
                  <p className="text-xs text-slate-500">Destination</p>
                  <p className="text-sm">{activeRide.destinationAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{activeRide.rider.name}</span>
              </div>
              <div>
                <p className="font-semibold text-green-400">
                  You earn {formatCurrency(splitFare(activeRide.estimatedFare).driverEarnings)}
                </p>
                <p className="text-xs text-slate-500">
                  Rider pays {formatCurrency(activeRide.estimatedFare)} (15% platform fee)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeRide.status === "DRIVER_ASSIGNED" && (
                  <Button onClick={() => rideAction("arriving")}>
                    Navigate to pickup
                  </Button>
                )}
                {activeRide.status === "DRIVER_ARRIVING" && (
                  <>
                    <Button onClick={() => rideAction("update_location")}>
                      Update location
                    </Button>
                    <Button onClick={() => rideAction("start")}>Start trip</Button>
                  </>
                )}
                {activeRide.status === "IN_PROGRESS" && (
                  <>
                    <Button onClick={() => rideAction("update_location")}>
                      Update progress
                    </Button>
                    <Button variant="secondary" onClick={() => rideAction("complete")}>
                      End trip
                    </Button>
                  </>
                )}
                <Button variant="danger" size="sm" onClick={() => rideAction("cancel")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
          <RideMap
            pickup={{ lat: activeRide.pickupLat, lng: activeRide.pickupLng }}
            destination={{
              lat: activeRide.destinationLat,
              lng: activeRide.destinationLng,
            }}
            driver={
              activeRide.driverLat && activeRide.driverLng
                ? { lat: activeRide.driverLat, lng: activeRide.driverLng }
                : profile?.currentLat
                  ? { lat: profile.currentLat, lng: profile.currentLng! }
                  : undefined
            }
            className="h-[360px] overflow-hidden rounded-2xl"
          />
        </div>
      ) : profile?.isOnline ? (
        <Card className="border-sky-500/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20">
                <Bell className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <p className="font-semibold">
                  {pendingCount > 0
                    ? `${pendingCount} ride request${pendingCount > 1 ? "s" : ""} waiting`
                    : "Listening for ride requests"}
                </p>
                <p className="text-sm text-slate-400">
                  {pendingCount > 0
                    ? "Head to ride requests to accept"
                    : "Requests will appear on the requests page"}
                </p>
              </div>
            </div>
            <Link href="/driver/requests">
              <Button>
                View requests
                {pendingCount > 0 && (
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {pendingCount}
                  </span>
                )}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            Go online to start receiving ride requests
          </CardContent>
        </Card>
      )}

      {lastEarning != null && !activeRide && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm text-slate-400">Latest earning today</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(lastEarning)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

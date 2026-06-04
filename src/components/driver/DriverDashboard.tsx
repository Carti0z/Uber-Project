"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RideMap } from "@/components/map/RideMap";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { FlowSteps } from "@/components/ui/FlowSteps";
import { api } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import { useGeolocation } from "@/hooks/useGeolocation";
import { splitFare } from "@/lib/fare";
import {
  formatCurrency,
  RIDE_STATUS_LABELS,
  DRIVER_FLOW_STEPS,
  driverFlowStep,
} from "@/lib/utils";
import { useRideRealtime } from "@/hooks/useRideRealtime";
import { Bell, Crosshair, Loader2, MapPin, Navigation, Power, User } from "lucide-react";

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

const LOCATION_UPDATE_MS = 10_000;

export function DriverDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastEarning, setLastEarning] = useState<number | null>(null);
  const lastSentRef = useRef(0);

  const {
    coords: liveLocation,
    loading: locating,
    error: geoError,
    supported: geoSupported,
  } = useGeolocation({
    enabled: !!profile?.isOnline,
    watch: !!profile?.isOnline,
    maximumAge: 5_000,
  });

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

  const syncLocation = useCallback(
    async (lat: number, lng: number) => {
      await api("/api/driver/profile", {
        method: "PATCH",
        body: JSON.stringify({ currentLat: lat, currentLng: lng }),
      });
      setProfile((p) => (p ? { ...p, currentLat: lat, currentLng: lng } : p));

      if (
        activeRide &&
        ["DRIVER_ASSIGNED", "DRIVER_ARRIVING", "IN_PROGRESS"].includes(activeRide.status)
      ) {
        await api(`/api/rides/${activeRide.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            action: "update_location",
            driverLat: lat,
            driverLng: lng,
          }),
        });
        setActiveRide((r) =>
          r ? { ...r, driverLat: lat, driverLng: lng } : r
        );
      }
    },
    [activeRide]
  );

  useEffect(() => {
    if (!liveLocation || !profile?.isOnline) return;
    const now = Date.now();
    if (now - lastSentRef.current < LOCATION_UPDATE_MS) return;
    lastSentRef.current = now;
    syncLocation(liveLocation.lat, liveLocation.lng).catch(() => {});
  }, [liveLocation, profile?.isOnline, syncLocation]);

  async function toggleOnline() {
    setLocationError(null);
    const newStatus = !profile?.isOnline;

    if (newStatus) {
      if (!geoSupported) {
        setLocationError("Your browser does not support location services.");
        return;
      }
      setTogglingOnline(true);
      try {
        const pos = await getCurrentPosition();
        await api("/api/driver/profile", {
          method: "PATCH",
          body: JSON.stringify({
            isOnline: true,
            currentLat: pos.lat,
            currentLng: pos.lng,
          }),
        });
      } catch (err) {
        setLocationError(
          err instanceof Error ? err.message : "Enable location to go online"
        );
        setTogglingOnline(false);
        return;
      }
      setTogglingOnline(false);
    } else {
      await api("/api/driver/profile", {
        method: "PATCH",
        body: JSON.stringify({ isOnline: false }),
      });
    }
    fetchData();
  }

  async function rideAction(action: string) {
    if (!activeRide) return;
    let driverLat = profile?.currentLat ?? liveLocation?.lat;
    let driverLng = profile?.currentLng ?? liveLocation?.lng;

    if (action === "update_location" || action === "arriving" || action === "start") {
      try {
        const pos = await getCurrentPosition({ maximumAge: 0 });
        driverLat = pos.lat;
        driverLng = pos.lng;
        await syncLocation(pos.lat, pos.lng);
      } catch {
        setLocationError("Could not read GPS for this action");
        return;
      }
    }

    const { data } = await api<{ ride: ActiveRide }>(`/api/rides/${activeRide.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        action,
        ...(driverLat != null && driverLng != null
          ? { driverLat, driverLng }
          : {}),
      }),
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

  const driverOnMap =
    activeRide?.driverLat && activeRide?.driverLng
      ? { lat: activeRide.driverLat, lng: activeRide.driverLng }
      : liveLocation
        ? { lat: liveLocation.lat, lng: liveLocation.lng }
        : profile?.currentLat && profile?.currentLng
          ? { lat: profile.currentLat, lng: profile.currentLng }
          : undefined;

  if (loading) return <p className="text-slate-400">Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Driver dashboard</h1>
          <p className="text-slate-400">
            {profile?.isOnline
              ? locating
                ? "Getting your live location…"
                : liveLocation
                  ? "Live GPS active — riders see your position"
                  : "You are online"
              : "You are offline"}
          </p>
          {(locationError || geoError) && profile?.isOnline && (
            <p className="mt-1 text-sm text-amber-400">{locationError || geoError}</p>
          )}
        </div>
        <Button
          variant={profile?.isOnline ? "danger" : "primary"}
          onClick={toggleOnline}
          size="lg"
          loading={togglingOnline}
          disabled={togglingOnline}
        >
          <Power className="h-5 w-5" />
          {profile?.isOnline ? "Go offline" : "Go online"}
        </Button>
      </div>

      {profile?.isOnline && liveLocation && (
        <p className="flex items-center gap-2 text-sm text-violet-400">
          <Crosshair className="h-4 w-4" />
          {liveLocation.lat.toFixed(5)}, {liveLocation.lng.toFixed(5)}
          {locating && <Loader2 className="h-3 w-3 animate-spin" />}
        </p>
      )}

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
            driver={driverOnMap}
            userLocation={liveLocation ?? undefined}
            followUser={!!liveLocation && !activeRide.driverLat}
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
                    : "Your live location is shared while online"}
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
            Go online to start receiving ride requests. Location access is required.
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

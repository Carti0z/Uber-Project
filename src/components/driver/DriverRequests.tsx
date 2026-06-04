"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FlowSteps } from "@/components/ui/FlowSteps";
import { api } from "@/lib/api";
import { splitFare } from "@/lib/fare";
import { formatCurrency, DRIVER_FLOW_STEPS, driverFlowStep } from "@/lib/utils";
import { useRideRealtime } from "@/hooks/useRideRealtime";
import { Bell, MapPin, Navigation, User } from "lucide-react";

interface RideRequest {
  id: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedFare: number;
  distanceKm: number;
  durationMin: number;
  rider: { name: string; phone: string | null };
}

interface DriverProfile {
  isOnline: boolean;
  documentsVerified: boolean;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationRemark: string | null;
}

export function DriverRequests() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const fetchData = useCallback(async () => {
    const [profileRes, requestsRes] = await Promise.all([
      api<{ profile: DriverProfile }>("/api/driver/profile"),
      api<{ requests: RideRequest[]; activeRide: unknown }>("/api/driver/requests"),
    ]);
    if (profileRes.data) setProfile(profileRes.data.profile);
    if (requestsRes.data) {
      setRequests(requestsRes.data.requests);
      if (requestsRes.data.activeRide) {
        router.push("/driver");
      }
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRideRealtime({
    onUpdate: fetchData,
    events: ["ride:requested", "ride:taken", "ride:accepted"],
  });

  async function acceptRide(rideId: string) {
    setError("");
    setActionId(rideId);
    const { error: acceptError } = await api(`/api/rides/${rideId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "accept" }),
    });
    setActionId(null);
    if (acceptError) {
      setError(acceptError);
      return;
    }
    router.push("/driver");
  }

  async function rejectRide(rideId: string) {
    setActionId(rideId);
    await api(`/api/rides/${rideId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "reject" }),
    });
    setActionId(null);
    fetchData();
  }

  const flowStep = driverFlowStep(!!profile?.isOnline, false);

  if (loading) return <p className="text-slate-400">Loading requests...</p>;

  if (!profile?.isOnline) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Ride requests</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto mb-4 h-10 w-10 text-slate-500" />
            <p className="text-slate-400">Go online from your dashboard to receive ride requests.</p>
            <Link href="/driver">
              <Button className="mt-4">Go to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile.documentsVerified) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Ride requests</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold text-amber-400">
              Verification required before accepting rides
            </p>
            <p className="mt-2 text-slate-400">
              {profile.verificationRemark ||
                "Please verify your NIN and driver's license with Prembly."}
            </p>
            <Link href="/driver/documents">
              <Button className="mt-5">Verify documents</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ride requests</h1>
        <p className="text-slate-400">Accept or reject incoming ride requests</p>
      </div>

      <FlowSteps steps={DRIVER_FLOW_STEPS} currentStep={flowStep} />
      {error && <p className="text-sm text-red-400">{error}</p>}

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/10">
              <Bell className="h-8 w-8 animate-pulse text-sky-400" />
            </div>
            <p className="font-medium">Waiting for ride requests...</p>
            <p className="mt-1 text-sm text-slate-400">New requests appear here automatically</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="border-sky-500/20">
              <CardContent className="py-5">
                <div className="mb-4 flex items-center gap-2 text-sm text-sky-400">
                  <Bell className="h-4 w-4" /> New ride request
                </div>
                <div className="mb-4 space-y-2">
                  <p className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                    {req.pickupAddress}
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    {req.destinationAddress}
                  </p>
                </div>
                <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" /> {req.rider.name}
                  </span>
                  <span>{req.distanceKm} km · ~{req.durationMin} min</span>
                  <span className="font-semibold text-green-400">
                    You earn {formatCurrency(splitFare(req.estimatedFare).driverEarnings)}
                  </span>
                  <span className="text-slate-500">
                    (fare {formatCurrency(req.estimatedFare)} · 15% fee)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => acceptRide(req.id)}
                    loading={actionId === req.id}
                  >
                    Accept ride
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => rejectRide(req.id)}
                    disabled={actionId === req.id}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

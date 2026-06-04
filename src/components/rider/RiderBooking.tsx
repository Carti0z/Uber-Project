"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RideMap } from "@/components/map/RideMap";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { FlowSteps } from "@/components/ui/FlowSteps";
import { api } from "@/lib/api";
import { reverseGeocode } from "@/lib/geolocation";
import { useGeolocation } from "@/hooks/useGeolocation";
import { formatCurrency, RIDER_BOOKING_STEPS } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Banknote,
  Crosshair,
  Loader2,
  MapPin,
  Navigation,
} from "lucide-react";

interface Estimate {
  distanceKm: number;
  durationMin: number;
  estimatedFare: number;
}

const FALLBACK_CENTER = { lat: 40.7128, lng: -74.006 };

export function RiderBooking() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [pickup, setPickup] = useState(FALLBACK_CENTER);
  const [destination, setDestination] = useState(FALLBACK_CENTER);
  const [selecting, setSelecting] = useState<"pickup" | "destination" | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
  const [loading, setLoading] = useState(false);
  const [locatingTarget, setLocatingTarget] = useState<"pickup" | "destination" | null>(null);
  const [error, setError] = useState("");

  const {
    coords: userLocation,
    loading: locatingUser,
    error: locationError,
    refresh: refreshLocation,
    supported: geoSupported,
  } = useGeolocation({ enabled: true, watch: step <= 2 });

  const applyCoords = useCallback(
    async (target: "pickup" | "destination", lat: number, lng: number) => {
      const address = await reverseGeocode(lat, lng);
      if (target === "pickup") {
        setPickup({ lat, lng });
        setPickupAddress(address);
      } else {
        setDestination({ lat, lng });
        setDestinationAddress(address);
      }
    },
    []
  );

  useEffect(() => {
    if (!userLocation || pickupAddress) return;
    applyCoords("pickup", userLocation.lat, userLocation.lng);
  }, [userLocation, pickupAddress, applyCoords]);

  const fetchEstimate = useCallback(async () => {
    const { data } = await api<Estimate>("/api/rides", {
      method: "POST",
      body: JSON.stringify({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
      }),
    });
    if (data) setEstimate(data);
  }, [pickup, destination]);

  useEffect(() => {
    if (step >= 3) fetchEstimate();
  }, [step, fetchEstimate]);

  useEffect(() => {
    async function checkActive() {
      const { data } = await api<{ rides: { id: string; status: string }[] }>("/api/rides");
      const active = data?.rides.find((r) =>
        ["REQUESTED", "DRIVER_ASSIGNED", "DRIVER_ARRIVING", "IN_PROGRESS"].includes(r.status)
      );
      if (active) router.push(`/rider/tracking/${active.id}`);
    }
    checkActive();
  }, [router]);

  async function handleMapClick(lat: number, lng: number) {
    if (selecting === "pickup" || (step === 1 && selecting === null)) {
      await applyCoords("pickup", lat, lng);
    } else if (selecting === "destination" || step === 2) {
      await applyCoords("destination", lat, lng);
    }
    setSelecting(null);
  }

  function applyMyLocation(target: "pickup" | "destination") {
    setError("");
    setLocatingTarget(target);
    if (userLocation) {
      applyCoords(target, userLocation.lat, userLocation.lng).then(() =>
        setLocatingTarget(null)
      );
      return;
    }
    refreshLocation();
  }

  useEffect(() => {
    if (!locatingTarget || !userLocation) return;
    applyCoords(locatingTarget, userLocation.lat, userLocation.lng).then(() =>
      setLocatingTarget(null)
    );
  }, [userLocation, locatingTarget, applyCoords]);

  useEffect(() => {
    if (!locatingTarget || userLocation) return;
    if (!locatingUser && locationError) {
      setError(locationError);
      setLocatingTarget(null);
    }
  }, [locatingTarget, locatingUser, locationError, userLocation]);

  async function requestRide() {
    setLoading(true);
    setError("");
    const { data, error: err } = await api<{ ride: { id: string } }>("/api/rides/request", {
      method: "POST",
      body: JSON.stringify({
        pickupAddress,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        destinationAddress,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        paymentMethod,
      }),
    });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (data?.ride.id) router.push(`/rider/tracking/${data.ride.id}`);
  }

  function nextStep() {
    setError("");
    if (step === 1 && !pickupAddress.trim()) {
      setError("Please set a pickup location");
      return;
    }
    if (step === 2 && !destinationAddress.trim()) {
      setError("Please set a destination");
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  }

  const locating = locatingUser || locatingTarget !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/rider">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Home
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Book a ride</h1>
          <p className="text-sm text-slate-400">Step {step} of 4</p>
        </div>
      </div>

      <FlowSteps steps={RIDER_BOOKING_STEPS} currentStep={step} />

      {geoSupported && (
        <p className="flex items-center gap-2 text-sm text-violet-400">
          {locating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Detecting your location…
            </>
          ) : userLocation ? (
            <>
              <Crosshair className="h-4 w-4" /> Live location active
            </>
          ) : locationError ? (
            <span className="text-amber-400">{locationError}</span>
          ) : null}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            {step === 1 && (
              <>
                <p className="text-sm text-slate-400">
                  Your pickup is set from GPS when allowed. You can also tap the map or enter an
                  address.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!geoSupported || locating}
                    onClick={() => applyMyLocation("pickup")}
                  >
                    {locating && locatingTarget === "pickup" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Crosshair className="h-4 w-4" />
                    )}
                    Use my location
                  </Button>
                  <Button
                    type="button"
                    variant={selecting === "pickup" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setSelecting(selecting === "pickup" ? null : "pickup")}
                  >
                    <MapPin className="h-4 w-4" /> Pin on map
                  </Button>
                </div>
                {selecting === "pickup" && (
                  <p className="text-sm text-amber-400">Click the map to set pickup</p>
                )}
                <Input
                  label="Pickup location"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Detecting location…"
                />
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-slate-400">Where are you headed?</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!geoSupported || locating}
                    onClick={() => applyMyLocation("destination")}
                  >
                    {locating && locatingTarget === "destination" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Crosshair className="h-4 w-4" />
                    )}
                    Use my location
                  </Button>
                  <Button
                    type="button"
                    variant={selecting === "destination" ? "primary" : "outline"}
                    size="sm"
                    onClick={() =>
                      setSelecting(selecting === "destination" ? null : "destination")
                    }
                  >
                    <Navigation className="h-4 w-4" /> Pin on map
                  </Button>
                </div>
                {selecting === "destination" && (
                  <p className="text-sm text-amber-400">Click the map to set destination</p>
                )}
                <Input
                  label="Destination"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder="Enter destination or use map"
                />
              </>
            )}

            {step === 3 && estimate && (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Estimated fare (you pay)</p>
                  <p className="text-4xl font-bold text-sky-400">
                    {formatCurrency(estimate.estimatedFare)}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {estimate.distanceKm} km · ~{estimate.durationMin} min
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700/50 p-4 text-sm">
                  <p className="text-slate-500">From</p>
                  <p className="mb-2">{pickupAddress}</p>
                  <p className="text-slate-500">To</p>
                  <p>{destinationAddress}</p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                {estimate && (
                  <div className="rounded-xl bg-sky-500/10 p-4">
                    <p className="text-2xl font-bold text-sky-400">
                      {formatCurrency(estimate.estimatedFare)}
                    </p>
                    <p className="text-sm text-slate-400">Ready to request your ride</p>
                  </div>
                )}
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-300">Payment method</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={paymentMethod === "CASH" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("CASH")}
                    >
                      <Banknote className="h-4 w-4" /> Cash
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === "CARD" ? "primary" : "outline"}
                      size="sm"
                      disabled
                      title="Coming soon"
                    >
                      <CreditCard className="h-4 w-4" /> Card (soon)
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-2 pt-2">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button className="flex-1" onClick={nextStep}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button className="flex-1" size="lg" onClick={requestRide} loading={loading}>
                  Request ride
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <h2 className="font-semibold">Route preview</h2>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <RideMap
              pickup={step >= 1 ? pickup : undefined}
              destination={step >= 2 ? destination : undefined}
              userLocation={userLocation ?? undefined}
              followUser={step === 1 && !!userLocation}
              onMapClick={handleMapClick}
              interactive
              className="h-[420px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

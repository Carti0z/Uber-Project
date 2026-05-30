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
import { formatCurrency, RIDER_BOOKING_STEPS } from "@/lib/utils";
import { ArrowLeft, ArrowRight, CreditCard, Banknote, MapPin, Navigation } from "lucide-react";

interface Estimate {
  distanceKm: number;
  durationMin: number;
  estimatedFare: number;
}

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };

export function RiderBooking() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pickupAddress, setPickupAddress] = useState("Times Square, New York");
  const [destinationAddress, setDestinationAddress] = useState("Central Park, New York");
  const [pickup, setPickup] = useState(DEFAULT_CENTER);
  const [destination, setDestination] = useState({ lat: 40.7829, lng: -73.9654 });
  const [selecting, setSelecting] = useState<"pickup" | "destination" | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  function handleMapClick(lat: number, lng: number) {
    if (selecting === "pickup" || (step === 1 && selecting === null)) {
      setPickup({ lat, lng });
      setPickupAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } else if (selecting === "destination" || step === 2) {
      setDestination({ lat, lng });
      setDestinationAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
    setSelecting(null);
  }

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            {step === 1 && (
              <>
                <p className="text-sm text-slate-400">Select your pickup location on the map or enter an address.</p>
                <Button
                  type="button"
                  variant={selecting === "pickup" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setSelecting(selecting === "pickup" ? null : "pickup")}
                >
                  <MapPin className="h-4 w-4" /> Pin pickup on map
                </Button>
                {selecting === "pickup" && (
                  <p className="text-sm text-amber-400">Click the map to set pickup</p>
                )}
                <Input
                  label="Pickup location"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                />
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-slate-400">Where are you headed?</p>
                <Button
                  type="button"
                  variant={selecting === "destination" ? "primary" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSelecting(selecting === "destination" ? null : "destination")
                  }
                >
                  <Navigation className="h-4 w-4" /> Pin destination on map
                </Button>
                {selecting === "destination" && (
                  <p className="text-sm text-amber-400">Click the map to set destination</p>
                )}
                <Input
                  label="Destination"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
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

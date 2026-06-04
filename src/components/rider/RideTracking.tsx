"use client";

import { useCallback, useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RideMap } from "@/components/map/RideMap";
import { RateDriver } from "@/components/rider/RateDriver";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { FlowSteps } from "@/components/ui/FlowSteps";
import { useRideRealtime } from "@/hooks/useRideRealtime";
import { api } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  RIDE_STATUS_LABELS,
  RIDER_TRIP_STEPS,
  riderTripStep,
} from "@/lib/utils";
import { Car, Clock, Phone, Receipt, Star, User } from "lucide-react";

interface Ride {
  id: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  estimatedFare: number;
  finalFare: number | null;
  paymentMethod: string;
  paymentStatus: string;
  etaMinutes: number | null;
  tripProgress: number;
  driverLat: number | null;
  driverLng: number | null;
  completedAt: string | null;
  rating: number | null;
  ratingComment: string | null;
  driver?: {
    name: string;
    phone: string | null;
    driverProfile?: {
      vehicleMake: string | null;
      vehicleModel: string | null;
      vehiclePlate: string | null;
      vehicleColor: string | null;
      averageRating: number;
      ratingCount: number;
    };
  };
}

export function RideTracking({ rideId }: { rideId: string }) {
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRide = useCallback(async () => {
    const { data } = await api<{ ride: Ride }>(`/api/rides/${rideId}`);
    if (data?.ride) setRide(data.ride);
    setLoading(false);
  }, [rideId]);

  useEffect(() => {
    fetchRide();
  }, [fetchRide]);

  useRideRealtime({ rideId, onUpdate: fetchRide });

  const isActive = ride ? !["COMPLETED", "CANCELLED"].includes(ride.status) : false;
  const { coords: userLocation } = useGeolocation({
    enabled: isActive,
    watch: isActive,
  });

  async function cancelRide() {
    await api(`/api/rides/${rideId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "cancel", cancelReason: "Rider cancelled" }),
    });
    router.push("/rider");
  }

  async function confirmCashPayment() {
    await api(`/api/rides/${rideId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "pay_cash" }),
    });
    fetchRide();
  }

  if (loading) return <p className="text-slate-400">Loading ride...</p>;
  if (!ride) return <p className="text-red-400">Ride not found</p>;

  const driverLoc =
    ride.driverLat && ride.driverLng
      ? { lat: ride.driverLat, lng: ride.driverLng }
      : undefined;
  const flowStep = riderTripStep(ride.status, !!ride.rating);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/rider" className="text-sm text-slate-400 hover:text-sky-400">
            ← Back to home
          </Link>
          <h1 className="text-2xl font-bold">Ride tracking</h1>
          <p className="text-sky-400">{RIDE_STATUS_LABELS[ride.status]}</p>
        </div>
        {isActive && (
          <Button variant="danger" size="sm" onClick={cancelRide}>
            Cancel ride
          </Button>
        )}
      </div>

      {!["CANCELLED"].includes(ride.status) && (
        <FlowSteps steps={RIDER_TRIP_STEPS} currentStep={flowStep} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <RideMap
              pickup={{ lat: ride.pickupLat, lng: ride.pickupLng }}
              destination={{ lat: ride.destinationLat, lng: ride.destinationLng }}
              driver={driverLoc}
              userLocation={userLocation ?? undefined}
              className="h-[360px]"
              interactive={false}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {ride.driver && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Your driver</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20">
                    <User className="h-6 w-6 text-sky-400" />
                  </div>
                  <div>
                    <p className="font-medium">{ride.driver.name}</p>
                    {ride.driver.driverProfile && ride.driver.driverProfile.ratingCount > 0 && (
                      <p className="flex items-center gap-1 text-sm text-amber-400">
                        <Star className="h-3 w-3 fill-current" />
                        {ride.driver.driverProfile.averageRating.toFixed(1)} (
                        {ride.driver.driverProfile.ratingCount} ratings)
                      </p>
                    )}
                    {ride.driver.phone && (
                      <p className="flex items-center gap-1 text-sm text-slate-400">
                        <Phone className="h-3 w-3" /> {ride.driver.phone}
                      </p>
                    )}
                  </div>
                </div>
                {ride.driver.driverProfile && (
                  <p className="flex items-center gap-2 text-sm text-slate-400">
                    <Car className="h-4 w-4" />
                    {ride.driver.driverProfile.vehicleColor}{" "}
                    {ride.driver.driverProfile.vehicleMake}{" "}
                    {ride.driver.driverProfile.vehicleModel} ·{" "}
                    {ride.driver.driverProfile.vehiclePlate}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-xs uppercase text-slate-500">Pickup</p>
                <p className="text-sm">{ride.pickupAddress}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Destination</p>
                <p className="text-sm">{ride.destinationAddress}</p>
              </div>
              {ride.etaMinutes != null && isActive && (
                <p className="flex items-center gap-2 text-amber-400">
                  <Clock className="h-4 w-4" /> ETA: {ride.etaMinutes} min
                </p>
              )}
              {ride.status === "IN_PROGRESS" && (
                <div>
                  <p className="mb-1 text-sm text-slate-400">Trip progress</p>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full bg-sky-500 transition-all"
                      style={{ width: `${ride.tripProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-lg font-semibold">
                {formatCurrency(ride.finalFare ?? ride.estimatedFare)}
              </p>
            </CardContent>
          </Card>

          {ride.status === "COMPLETED" && ride.driver && (
            <RateDriver
              rideId={ride.id}
              driverName={ride.driver.name}
              existingRating={ride.rating}
              onRated={fetchRide}
            />
          )}

          {ride.status === "COMPLETED" && (
            <Card>
              <CardHeader>
                <h2 className="flex items-center gap-2 font-semibold">
                  <Receipt className="h-5 w-5" /> Receipt
                </h2>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Payment: {ride.paymentMethod}</p>
                <p>Status: {ride.paymentStatus}</p>
                {ride.completedAt && <p>Completed: {formatDate(ride.completedAt)}</p>}
                {ride.paymentMethod === "CASH" && ride.paymentStatus === "PENDING" && (
                  <Button size="sm" onClick={confirmCashPayment}>
                    Confirm cash paid
                  </Button>
                )}
                <Link href="/rider/history">
                  <Button variant="outline" size="sm" className="mt-2">
                    View history
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

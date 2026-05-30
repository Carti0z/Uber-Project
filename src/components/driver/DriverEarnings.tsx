"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, Percent, TrendingUp } from "lucide-react";

interface EarningsData {
  totalEarnings: number;
  totalGross: number;
  totalCommission: number;
  commissionPercent: number;
  tripCount: number;
  rides: {
    id: string;
    estimatedFare: number;
    finalFare: number | null;
    displayEarnings?: number;
    completedAt: string | null;
    destinationAddress: string;
    rider: { name: string };
  }[];
}

export function DriverEarnings() {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const [data, setData] = useState<EarningsData | null>(null);

  useEffect(() => {
    api<EarningsData>(`/api/driver/earnings?period=${period}`).then(({ data: d }) => {
      if (d) setData(d);
    });
  }, [period]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Earnings</h1>
      <p className="mb-6 text-sm text-slate-400">
        Your net payout after Movee&apos;s {data?.commissionPercent ?? 15}% platform commission
      </p>

      <div className="mb-6 flex gap-2">
        {(["daily", "weekly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              period === p ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-400"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Your {period} earnings</p>
              <p className="text-2xl font-bold">
                {formatCurrency(data?.totalEarnings ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
              <Percent className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Platform fee ({data?.commissionPercent ?? 15}%)</p>
              <p className="text-2xl font-bold text-amber-400">
                −{formatCurrency(data?.totalCommission ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20">
              <TrendingUp className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Trips · gross fares</p>
              <p className="text-2xl font-bold">
                {data?.tripCount ?? 0}{" "}
                <span className="text-base font-normal text-slate-400">
                  ({formatCurrency(data?.totalGross ?? 0)})
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Trip history</h2>
      <div className="space-y-3">
        {!data?.rides.length && (
          <p className="text-slate-400">No completed trips in this period.</p>
        )}
        {data?.rides.map((ride) => (
          <Card key={ride.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{ride.destinationAddress}</p>
                <p className="text-sm text-slate-400">
                  {ride.completedAt && formatDate(ride.completedAt)} · {ride.rider.name}
                </p>
                <p className="text-xs text-slate-500">
                  Fare {formatCurrency(ride.finalFare ?? ride.estimatedFare)} · you earned{" "}
                  {formatCurrency(
                    ride.displayEarnings ??
                      (ride.finalFare ?? ride.estimatedFare) * 0.85
                  )}
                </p>
              </div>
              <p className="font-semibold text-green-400">
                {formatCurrency(
                  ride.displayEarnings ??
                    (ride.finalFare ?? ride.estimatedFare) * 0.85
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

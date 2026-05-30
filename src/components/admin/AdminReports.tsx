"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useRideRealtime } from "@/hooks/useRideRealtime";
import {
  BarChart3,
  DollarSign,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

interface Reports {
  summary: {
    totalRevenue: number;
    grossTripVolume: number;
    totalDriverPayouts: number;
    commissionPercent: number;
    avgFare: number;
    avgDistance: number;
    completionRate: number;
    cancellationRate: number;
    avgRating: number;
    newRiders30d: number;
    newDrivers30d: number;
  };
  paymentBreakdown: { cash: number; card: number };
  monthlyTrips: { month: string; trips: number; revenue: number; commission: number }[];
  topDrivers: { name: string; trips: number; earnings: number }[];
}

export function AdminReports() {
  const [reports, setReports] = useState<Reports | null>(null);

  const load = useCallback(() => {
    api<Reports>("/api/admin/reports").then(({ data }) => {
      if (data) setReports(data);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRideRealtime({
    onUpdate: load,
    events: ["ride:completed", "ride:status", "ride:requested"],
  });

  if (!reports) return <p className="text-slate-400">Loading reports...</p>;

  const maxRevenue = Math.max(...reports.monthlyTrips.map((m) => m.revenue), 1);
  const totalPayments =
    reports.paymentBreakdown.cash + reports.paymentBreakdown.card;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-slate-400">
          {reports.summary.commissionPercent}% commission on every completed ride
        </p>
      </div>

      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="grid gap-4 py-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">Platform commission</p>
            <p className="text-xl font-bold text-emerald-400">
              {formatCurrency(reports.summary.totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Gross trip volume</p>
            <p className="text-xl font-bold">{formatCurrency(reports.summary.grossTripVolume)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Paid to drivers</p>
            <p className="text-xl font-bold text-sky-400">
              {formatCurrency(reports.summary.totalDriverPayouts)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Commission earned",
            value: formatCurrency(reports.summary.totalRevenue),
            icon: DollarSign,
            color: "text-green-400",
            bg: "bg-green-500/20",
          },
          {
            label: "Completion rate",
            value: `${reports.summary.completionRate}%`,
            icon: TrendingUp,
            color: "text-sky-400",
            bg: "bg-sky-500/20",
          },
          {
            label: "Cancellation rate",
            value: `${reports.summary.cancellationRate}%`,
            icon: TrendingDown,
            color: "text-red-400",
            bg: "bg-red-500/20",
          },
          {
            label: "Avg rating",
            value: reports.summary.avgRating > 0 ? `${reports.summary.avgRating} ★` : "N/A",
            icon: Star,
            color: "text-amber-400",
            bg: "bg-amber-500/20",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-xl font-bold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5 text-sky-400" /> Monthly revenue (6 mo)
            </h2>
            <div className="flex h-44 items-end gap-3">
              {reports.monthlyTrips.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500">{m.trips}</span>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-sky-700 to-sky-400"
                    style={{ height: `${Math.max(8, (m.revenue / maxRevenue) * 100)}%` }}
                    title={formatCurrency(m.revenue)}
                  />
                  <span className="text-[10px] text-slate-500">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold">Key metrics</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between rounded-lg bg-slate-900/50 px-4 py-3">
                <span className="text-slate-400">Average fare</span>
                <span className="font-medium">{formatCurrency(reports.summary.avgFare)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-slate-900/50 px-4 py-3">
                <span className="text-slate-400">Average distance</span>
                <span className="font-medium">{reports.summary.avgDistance} km</span>
              </div>
              <div className="flex justify-between rounded-lg bg-slate-900/50 px-4 py-3">
                <span className="text-slate-400">New riders (30d)</span>
                <span className="font-medium">{reports.summary.newRiders30d}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-slate-900/50 px-4 py-3">
                <span className="text-slate-400">New drivers (30d)</span>
                <span className="font-medium">{reports.summary.newDrivers30d}</span>
              </div>
              {totalPayments > 0 && (
                <div className="flex justify-between rounded-lg bg-slate-900/50 px-4 py-3">
                  <span className="text-slate-400">Cash vs Card</span>
                  <span className="font-medium">
                    {Math.round((reports.paymentBreakdown.cash / totalPayments) * 100)}% cash
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5 text-amber-400" /> Top drivers
          </h2>
          {reports.topDrivers.length === 0 ? (
            <p className="text-slate-400">No completed trips yet.</p>
          ) : (
            <div className="space-y-2">
              {reports.topDrivers.map((d, i) => (
                <div
                  key={d.name + i}
                  className="flex items-center justify-between rounded-lg bg-slate-900/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{d.name}</span>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-green-400">{formatCurrency(d.earnings)}</p>
                    <p className="text-slate-500">{d.trips} trips</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

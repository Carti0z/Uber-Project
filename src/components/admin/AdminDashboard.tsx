"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useRideRealtime } from "@/hooks/useRideRealtime";
import { Car, DollarSign, TrendingUp, Users } from "lucide-react";

interface Stats {
  totalRiders: number;
  totalDrivers: number;
  totalTrips: number;
  completedTrips: number;
  activeTrips: number;
  cancelledTrips: number;
  totalRevenue: number;
  grossTripVolume: number;
  commissionPercent: number;
  paidTrips: number;
  dailyRevenue: { date: string; revenue: number; trips: number }[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: apiError } = await api<Stats>("/api/admin/stats");
    if (data) {
      setStats(data);
    } else {
      setError(apiError || "Failed to load dashboard");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRideRealtime({
    onUpdate: load,
    events: ["ride:requested", "ride:accepted", "ride:status", "ride:completed"],
  });

  if (loading && !stats) {
    return <p className="text-slate-400">Loading dashboard...</p>;
  }

  if (error && !stats) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">{error}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const maxRevenue = Math.max(...stats.dailyRevenue.map((d) => d.revenue), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <p className="text-slate-400">Platform overview and analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total riders", value: stats.totalRiders, icon: Users, color: "text-sky-400", bg: "bg-sky-500/20" },
          { label: "Total drivers", value: stats.totalDrivers, icon: Car, color: "text-amber-400", bg: "bg-amber-500/20" },
          { label: "Total trips", value: stats.totalTrips, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/20" },
          {
            label: `Commission (${stats.commissionPercent}%)`,
            value: formatCurrency(stats.totalRevenue),
            icon: DollarSign,
            color: "text-emerald-400",
            bg: "bg-emerald-500/20",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 py-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold">Trip breakdown</h2>
            <div className="space-y-3">
              {[
                { label: "Active", count: stats.activeTrips, href: "/admin/rides?filter=active", color: "bg-sky-500" },
                { label: "Completed", count: stats.completedTrips, href: "/admin/rides?filter=completed", color: "bg-green-500" },
                { label: "Cancelled", count: stats.cancelledTrips, href: "/admin/rides?filter=cancelled", color: "bg-red-500" },
              ].map((row) => (
                <Link
                  key={row.label}
                  href={row.href}
                  className="flex items-center justify-between rounded-xl bg-slate-900/50 px-4 py-3 transition hover:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                    <span>{row.label}</span>
                  </div>
                  <span className="font-semibold">{row.count}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold">Commission revenue (7 days)</h2>
            <p className="mb-4 text-sm text-slate-400">
              {stats.paidTrips} paid trips · {formatCurrency(stats.totalRevenue)} commission ·{" "}
              {formatCurrency(stats.grossTripVolume)} gross volume
            </p>
            <div className="flex h-40 items-end gap-2">
              {stats.dailyRevenue.map((day) => (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-slate-500">{day.trips}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-sky-600 to-sky-400 transition-all"
                    style={{ height: `${Math.max(8, (day.revenue / maxRevenue) * 100)}%` }}
                    title={formatCurrency(day.revenue)}
                  />
                  <span className="text-[10px] text-slate-500">{day.date.split(",")[0]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/users" className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400">
          User management
        </Link>
        <Link href="/admin/rides" className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800">
          Ride management
        </Link>
        <Link href="/admin/reports" className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800">
          Reports
        </Link>
      </div>
    </div>
  );
}

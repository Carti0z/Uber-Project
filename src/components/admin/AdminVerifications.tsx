"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Clock3, ShieldAlert, User } from "lucide-react";

type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

interface DriverVerificationRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  suspended: boolean;
  createdAt: string;
  _count: { ridesAsDriver: number };
  driverProfile: {
    nin: string | null;
    licenseNumber: string | null;
    documentsVerified: boolean;
    ninVerified: boolean;
    licenseVerified: boolean;
    verificationStatus: VerificationStatus;
    verificationRemark: string | null;
    verificationCheckedAt: string | null;
    updatedAt: string;
  } | null;
}

export function AdminVerifications() {
  const [drivers, setDrivers] = useState<DriverVerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "ALL">("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api<{ drivers: DriverVerificationRow[] }>("/api/admin/verifications");
    if (data?.drivers) setDrivers(data.drivers);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return drivers;
    return drivers.filter(
      (driver) => driver.driverProfile?.verificationStatus === statusFilter
    );
  }, [drivers, statusFilter]);

  const stats = useMemo(() => {
    const counts = { all: drivers.length, pending: 0, verified: 0, rejected: 0 };
    for (const d of drivers) {
      const status = d.driverProfile?.verificationStatus || "PENDING";
      if (status === "VERIFIED") counts.verified += 1;
      else if (status === "REJECTED") counts.rejected += 1;
      else counts.pending += 1;
    }
    return counts;
  }, [drivers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Driver verification review</h1>
        <p className="text-slate-400">
          Central review of NIN and driver&apos;s license verification outcomes.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="All drivers" value={stats.all} icon={User} color="text-sky-400" />
        <StatCard label="Pending" value={stats.pending} icon={Clock3} color="text-amber-400" />
        <StatCard
          label="Verified"
          value={stats.verified}
          icon={CheckCircle2}
          color="text-green-400"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={ShieldAlert}
          color="text-red-400"
        />
      </div>

      <div className="flex gap-2">
        {(["ALL", "PENDING", "VERIFIED", "REJECTED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              statusFilter === status ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-300"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400">Loading verification records...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-400">
            No drivers found for the selected status.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((driver) => {
            const profile = driver.driverProfile;
            const status = profile?.verificationStatus || "PENDING";
            const badgeClass =
              status === "VERIFIED"
                ? "bg-green-500/20 text-green-400"
                : status === "REJECTED"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-amber-500/20 text-amber-400";

            return (
              <Card key={driver.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-sm text-slate-400">{driver.email}</p>
                      {driver.phone && <p className="text-sm text-slate-500">{driver.phone}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {driver.suspended && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                          Suspended
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs ${badgeClass}`}>
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <Info label="NIN" value={profile?.nin || "Not provided"} />
                    <Info
                      label="License"
                      value={profile?.licenseNumber || "Not provided"}
                    />
                    <Info
                      label="Checks"
                      value={`NIN: ${profile?.ninVerified ? "Pass" : "Fail/Pending"} · License: ${
                        profile?.licenseVerified ? "Pass" : "Fail/Pending"
                      }`}
                    />
                    <Info
                      label="Trips"
                      value={`${driver._count.ridesAsDriver} completed/assigned trips`}
                    />
                  </div>

                  <div className="rounded-lg bg-slate-900/50 p-3 text-sm">
                    <p className="text-slate-400">Status remark</p>
                    <p className="mt-1">
                      {profile?.verificationRemark || "No remark recorded yet."}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500">
                    Joined {formatDate(driver.createdAt)} · Last verification{" "}
                    {profile?.verificationCheckedAt
                      ? formatDate(profile.verificationCheckedAt)
                      : "not run"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="rounded-lg bg-slate-800 p-2">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900/50 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

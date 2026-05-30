"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Ban, CheckCircle, User } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  suspended: boolean;
  createdAt: string;
  driverProfile?: {
    isOnline: boolean;
    vehicleMake: string | null;
    vehicleModel: string | null;
    vehiclePlate: string | null;
    vehicleColor: string | null;
    documentsVerified: boolean;
  } | null;
  _count: { ridesAsRider?: number; ridesAsDriver?: number };
}

export function AdminUsers() {
  const [tab, setTab] = useState<"RIDER" | "DRIVER">("RIDER");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await api<{ users: UserRow[] }>(`/api/admin/users?role=${tab}`);
    if (data) setUsers(data.users);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function toggleSuspend(user: UserRow) {
    setActionId(user.id);
    await api(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ suspended: !user.suspended }),
    });
    setActionId(null);
    loadUsers();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User management</h1>
        <p className="text-slate-400">View and manage riders and drivers</p>
      </div>

      <div className="flex gap-2">
        {(["RIDER", "DRIVER"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setTab(r)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              tab === r ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-400"
            }`}
          >
            {r === "RIDER" ? "Riders" : "Drivers"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400">Loading users...</p>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-400">
            No {tab === "RIDER" ? "riders" : "drivers"} found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
                    <User className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                      {user.suspended && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                          Suspended
                        </span>
                      )}
                      {tab === "DRIVER" && user.driverProfile?.isOnline && !user.suspended && (
                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                          Online
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{user.email}</p>
                    {user.phone && <p className="text-sm text-slate-500">{user.phone}</p>}
                    {tab === "DRIVER" && user.driverProfile && (
                      <p className="text-sm text-slate-500">
                        {user.driverProfile.vehicleColor} {user.driverProfile.vehicleMake}{" "}
                        {user.driverProfile.vehicleModel} · {user.driverProfile.vehiclePlate}
                        {user.driverProfile.documentsVerified && " · Verified"}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Joined {formatDate(user.createdAt)} ·{" "}
                      {tab === "RIDER"
                        ? `${user._count.ridesAsRider ?? 0} rides`
                        : `${user._count.ridesAsDriver ?? 0} trips`}
                    </p>
                  </div>
                </div>
                <Button
                  variant={user.suspended ? "primary" : "danger"}
                  size="sm"
                  loading={actionId === user.id}
                  onClick={() => toggleSuspend(user)}
                >
                  {user.suspended ? (
                    <>
                      <CheckCircle className="h-4 w-4" /> Reactivate
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4" /> Suspend
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { CheckCircle, FileText } from "lucide-react";

interface DriverProfile {
  licenseNumber: string | null;
  licenseDocUrl: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  vehicleColor: string | null;
  vehicleDocUrl: string | null;
  documentsVerified: boolean;
}

export function DriverDocuments() {
  const [form, setForm] = useState({
    licenseNumber: "",
    licenseDocUrl: "",
    vehicleMake: "",
    vehicleModel: "",
    vehiclePlate: "",
    vehicleColor: "",
    vehicleDocUrl: "",
  });
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ profile: DriverProfile }>("/api/driver/profile").then(({ data }) => {
      if (data?.profile) {
        const p = data.profile;
        setForm({
          licenseNumber: p.licenseNumber || "",
          licenseDocUrl: p.licenseDocUrl || "",
          vehicleMake: p.vehicleMake || "",
          vehicleModel: p.vehicleModel || "",
          vehiclePlate: p.vehiclePlate || "",
          vehicleColor: p.vehicleColor || "",
          vehicleDocUrl: p.vehicleDocUrl || "",
        });
        setVerified(p.documentsVerified);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await api<{ profile: DriverProfile }>("/api/driver/profile", {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (error) {
      setMessage(error);
      return;
    }
    setVerified(data?.profile.documentsVerified ?? false);
    setMessage("Documents saved successfully");
  }

  return (
    <Card className="max-w-lg">
      <CardContent className="pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Driver documents</h1>
          {verified && (
            <span className="flex items-center gap-1 text-sm text-green-400">
              <CheckCircle className="h-4 w-4" /> Verified
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <FileText className="h-4 w-4" /> License
          </p>
          <Input
            label="License number"
            value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
          />
          <Input
            label="License document URL"
            value={form.licenseDocUrl}
            onChange={(e) => setForm({ ...form, licenseDocUrl: e.target.value })}
            placeholder="https://..."
          />

          <hr className="border-slate-700" />
          <p className="text-sm font-medium text-slate-300">Vehicle registration</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Make"
              value={form.vehicleMake}
              onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })}
            />
            <Input
              label="Model"
              value={form.vehicleModel}
              onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
            />
            <Input
              label="Plate"
              value={form.vehiclePlate}
              onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
            />
            <Input
              label="Color"
              value={form.vehicleColor}
              onChange={(e) => setForm({ ...form, vehicleColor: e.target.value })}
            />
          </div>
          <Input
            label="Vehicle document URL"
            value={form.vehicleDocUrl}
            onChange={(e) => setForm({ ...form, vehicleDocUrl: e.target.value })}
            placeholder="https://..."
          />

          {message && (
            <p className={`text-sm ${message.includes("success") ? "text-green-400" : "text-red-400"}`}>
              {message}
            </p>
          )}
          <Button type="submit" loading={loading}>
            Save documents
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

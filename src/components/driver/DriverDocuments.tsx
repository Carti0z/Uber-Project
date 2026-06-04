"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { CheckCircle, FileText, IdCard, ShieldCheck } from "lucide-react";

interface DriverProfile {
  nin: string | null;
  licenseNumber: string | null;
  licenseDocUrl: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  vehicleColor: string | null;
  vehicleDocUrl: string | null;
  ninVerified: boolean;
  licenseVerified: boolean;
  documentsVerified: boolean;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationRemark: string | null;
  verificationCheckedAt: string | null;
}

export function DriverDocuments() {
  const [form, setForm] = useState({
    nin: "",
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
  const [remark, setRemark] = useState("");
  const [status, setStatus] = useState<DriverProfile["verificationStatus"]>("PENDING");
  const [ninVerified, setNinVerified] = useState(false);
  const [licenseVerified, setLicenseVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    api<{ profile: DriverProfile }>("/api/driver/profile").then(({ data }) => {
      if (data?.profile) {
        const p = data.profile;
        setForm({
          nin: p.nin || "",
          licenseNumber: p.licenseNumber || "",
          licenseDocUrl: p.licenseDocUrl || "",
          vehicleMake: p.vehicleMake || "",
          vehicleModel: p.vehicleModel || "",
          vehiclePlate: p.vehiclePlate || "",
          vehicleColor: p.vehicleColor || "",
          vehicleDocUrl: p.vehicleDocUrl || "",
        });
        setVerified(p.documentsVerified);
        setNinVerified(p.ninVerified);
        setLicenseVerified(p.licenseVerified);
        setStatus(p.verificationStatus);
        setRemark(p.verificationRemark || "");
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
    setNinVerified(data?.profile.ninVerified ?? false);
    setLicenseVerified(data?.profile.licenseVerified ?? false);
    setStatus(data?.profile.verificationStatus ?? "PENDING");
    setRemark(
      data?.profile.verificationRemark ||
        "Verification pending. Click 'Verify with Prembly' after saving."
    );
    setMessage("Documents saved. Run verification to activate ride acceptance.");
  }

  async function handleVerify() {
    setVerifying(true);
    setMessage("");
    const { data, error } = await api<{ profile: DriverProfile }>("/api/driver/verify", {
      method: "POST",
      body: JSON.stringify({
        nin: form.nin,
        licenseNumber: form.licenseNumber,
      }),
    });
    setVerifying(false);
    if (error) {
      setMessage(error);
      return;
    }

    const profile = data?.profile;
    if (!profile) {
      setMessage("Verification completed with no response.");
      return;
    }

    setVerified(profile.documentsVerified);
    setNinVerified(profile.ninVerified);
    setLicenseVerified(profile.licenseVerified);
    setStatus(profile.verificationStatus);
    setRemark(profile.verificationRemark || "");
    setMessage(
      profile.documentsVerified
        ? "Verification passed. You can now accept rides."
        : "Verification did not pass. Check the status remark below."
    );
  }

  return (
    <Card className="max-w-lg">
      <CardContent className="pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Driver verification</h1>
          {verified && (
            <span className="flex items-center gap-1 text-sm text-green-400">
              <CheckCircle className="h-4 w-4" /> Verified
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <IdCard className="h-4 w-4" /> Identity verification
          </p>
          <Input
            label="National ID Number (NIN)"
            value={form.nin}
            onChange={(e) => setForm({ ...form, nin: e.target.value })}
            placeholder="11-digit NIN"
          />
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

          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm">
            <p className="mb-2 flex items-center gap-2 font-medium text-slate-300">
              <ShieldCheck className="h-4 w-4" /> Verification status
            </p>
            <p className="text-slate-400">Status: {status}</p>
            <p className="text-slate-400">NIN check: {ninVerified ? "Passed" : "Pending/Failed"}</p>
            <p className="text-slate-400">
              License check: {licenseVerified ? "Passed" : "Pending/Failed"}
            </p>
            {remark && <p className="mt-2 text-amber-300">Remark: {remark}</p>}
          </div>

          {message && (
            <p
              className={`text-sm ${
                /(saved|passed|completed)/i.test(message) ? "text-green-400" : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={loading}>
              Save documents
            </Button>
            <Button type="button" variant="secondary" onClick={handleVerify} loading={verifying}>
              Verify with Prembly
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

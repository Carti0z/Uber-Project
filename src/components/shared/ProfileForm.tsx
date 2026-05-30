"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";

export function ProfileForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ user: { name: string; email: string; phone: string | null } }>("/api/profile").then(
      ({ data }) => {
        if (data?.user) {
          setName(data.user.name);
          setEmail(data.user.email);
          setPhone(data.user.phone || "");
        }
      }
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await api("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({
        name,
        phone,
        ...(newPassword && { currentPassword, newPassword }),
      }),
    });
    setLoading(false);
    setMessage(error || "Profile updated");
    if (!error) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  return (
    <Card className="max-w-lg">
      <CardContent className="pt-6">
        <h1 className="mb-6 text-2xl font-bold">Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={email} disabled />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <hr className="border-slate-700" />
          <p className="text-sm font-medium text-slate-300">Change password</p>
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {message && (
            <p className={`text-sm ${message.includes("updated") ? "text-green-400" : "text-red-400"}`}>
              {message}
            </p>
          )}
          <Button type="submit" loading={loading}>
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

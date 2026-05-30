"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenParam);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await api("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/login");
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-8">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label="Reset token" value={token} onChange={(e) => setToken(e.target.value)} required />
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Update password
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-sky-400 hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}

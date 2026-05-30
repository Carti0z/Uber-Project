"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await api<{ message: string; resetToken?: string }>(
      "/api/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) }
    );
    setLoading(false);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage(data?.message || "Check your email.");
    if (data?.resetToken) setResetToken(data.resetToken);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8">
          <h1 className="text-2xl font-bold">Forgot password</h1>
          <p className="mt-1 text-slate-400">We&apos;ll send you a reset link</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {message && (
              <p className="text-sm text-slate-300">
                {message}
                {resetToken && (
                  <>
                    {" "}
                    <Link
                      href={`/reset-password?token=${resetToken}`}
                      className="text-sky-400 hover:underline"
                    >
                      Reset now
                    </Link>
                  </>
                )}
              </p>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              Send reset link
            </Button>
          </form>

          <p className="mt-6 text-center text-sm">
            <Link href="/login" className="text-sky-400 hover:underline">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

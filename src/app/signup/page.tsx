"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { Car } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "driver" ? "DRIVER" : "RIDER";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"RIDER" | "DRIVER">(defaultRole);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: err } = await api<{ user: { role: string } }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, phone, password, role }),
    });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.push(data?.user.role === "DRIVER" ? "/driver/documents" : "/rider");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500">
            <Car className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Register</h1>
          <p className="mt-1 text-slate-400">Join Movee today</p>
        </div>

        <div className="mb-6 flex rounded-xl bg-slate-900 p-1">
          {(["RIDER", "DRIVER"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                role === r ? "bg-sky-500 text-white" : "text-slate-400"
              }`}
            >
              {r === "RIDER" ? "Rider" : "Driver"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-sky-400 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}

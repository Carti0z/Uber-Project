import Link from "next/link";
import { Car, MapPin, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect(
      session.role === "ADMIN"
        ? "/admin"
        : session.role === "DRIVER"
          ? "/driver"
          : "/rider"
    );
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500">
            <Car className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold">
            Move<span className="text-sky-400">e</span>
          </span>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="py-16 text-center md:py-24">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Move smarter.
            <br />
            <span className="bg-gradient-to-r from-sky-400 to-amber-400 bg-clip-text text-transparent">
              Ride anywhere.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Movee connects riders and drivers in real time. Book a ride in seconds,
            track your driver live, and pay your way — cash today, cards coming soon.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/register?role=rider">
              <Button size="lg">Ride as passenger</Button>
            </Link>
            <Link href="/register?role=driver">
              <Button size="lg" variant="secondary">
                Drive & earn
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Instant booking",
              desc: "Set pickup and destination, get fare estimates, and request a ride instantly.",
            },
            {
              icon: MapPin,
              title: "Live tracking",
              desc: "See your driver on the map, ETA updates, and trip progress in real time.",
            },
            {
              icon: Shield,
              title: "Safe & simple",
              desc: "Verified drivers, ride history, receipts, and secure authentication.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6"
            >
              <f.icon className="mb-4 h-8 w-8 text-sky-400" />
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Movee. All rights reserved.
      </footer>
    </div>
  );
}

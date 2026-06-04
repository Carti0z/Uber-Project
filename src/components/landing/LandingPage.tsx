"use client";

import Link from "next/link";
import {
  ArrowRight,
  Car,
  Clock,
  MapPin,
  Navigation,
  Shield,
  Smartphone,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CityScene } from "./CityScene";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant booking",
    desc: "Set pickup and destination, get fare estimates, and request a ride in seconds.",
    accent: "from-sky-500/20 to-sky-500/5",
    iconColor: "text-sky-400",
  },
  {
    icon: MapPin,
    title: "Live tracking",
    desc: "GPS pickup, driver location on the map, ETA updates, and trip progress in real time.",
    accent: "from-violet-500/20 to-violet-500/5",
    iconColor: "text-violet-400",
  },
  {
    icon: Shield,
    title: "Safe & simple",
    desc: "Verified drivers, ride history, receipts, and secure authentication built in.",
    accent: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
  },
];

const STEPS = [
  { step: "01", title: "Set your route", desc: "Use live GPS or tap the map for pickup and destination.", icon: Navigation },
  { step: "02", title: "Match with a driver", desc: "Nearby drivers get your request instantly via real-time alerts.", icon: Users },
  { step: "03", title: "Ride & pay", desc: "Track the trip live, then pay cash or card when you arrive.", icon: Smartphone },
];

const STATS = [
  { value: "Live", label: "GPS tracking" },
  { value: "15%", label: "Fair commission" },
  { value: "24/7", label: "City coverage" },
  { value: "Real-time", label: "Driver updates" },
];

export function LandingPage() {
  return (
    <div className="landing-page relative min-h-screen overflow-hidden">
      {/* Background layers */}
      <div className="landing-bg-grid pointer-events-none absolute inset-0" />
      <div className="landing-orb landing-orb-1 pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="landing-orb landing-orb-2 pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="landing-orb landing-orb-3 pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Header */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-500/30 transition group-hover:scale-105">
            <Car className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Move<span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">e</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button className="shadow-lg shadow-sky-500/20">Get started</Button>
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-8">
        {/* Hero + city scene */}
        <section className="relative min-h-[85vh] overflow-hidden pb-36 pt-8 text-center md:pb-44 md:pt-16">
          <CityScene />
          <div className="relative z-10">
          <div className="landing-fade-in mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
            </span>
            Real-time rides across your city
          </div>

          <h1 className="landing-fade-in landing-delay-1 mx-auto max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
            Your city.
            <br />
            <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
              One tap away.
            </span>
          </h1>

          <p className="landing-fade-in landing-delay-2 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
            Movee connects riders and drivers with live maps, instant matching, and
            transparent fares — built for modern urban mobility.
          </p>

          <div className="landing-fade-in landing-delay-3 mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register?role=rider">
              <Button size="lg" className="min-w-[200px] shadow-xl shadow-sky-500/25">
                Ride as passenger
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register?role=driver">
              <Button size="lg" variant="secondary" className="min-w-[200px] shadow-xl shadow-amber-500/20">
                Drive & earn
                <Car className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Stats strip */}
          <div className="landing-fade-in landing-delay-4 mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-700/40 bg-slate-900/50 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-lg font-bold text-white md:text-xl">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* App preview card */}
        <section className="landing-fade-in landing-delay-5 relative mx-auto mb-20 max-w-4xl">
          <div className="overflow-hidden rounded-3xl border border-slate-600/40 bg-slate-900/60 p-1 shadow-2xl shadow-sky-500/10 backdrop-blur-md">
            <div className="rounded-[1.35rem] bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex-1 space-y-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
                    In the app
                  </p>
                  <h2 className="text-2xl font-bold md:text-3xl">
                    Book, track, and arrive — all in one place
                  </h2>
                  <ul className="space-y-3 text-sm text-slate-400">
                    <li className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 shrink-0 text-violet-400" />
                      Auto-detect pickup with live GPS
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                      See driver ETA and trip progress
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 shrink-0 text-amber-400" />
                      Rate drivers and view receipts
                    </li>
                  </ul>
                </div>
                <div className="relative mx-auto w-full max-w-[280px] shrink-0">
                  <div className="rounded-2xl border border-slate-600/50 bg-slate-950 p-4 shadow-inner">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Route preview</span>
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">
                        Live
                      </span>
                    </div>
                    <div className="relative h-36 overflow-hidden rounded-xl bg-slate-800">
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-900/40 to-slate-900" />
                      <div className="absolute bottom-4 left-4 h-3 w-3 rounded-full border-2 border-white bg-violet-500 shadow-lg" title="You" />
                      <div className="absolute right-8 top-8 h-3 w-3 rounded-full border-2 border-white bg-green-500" title="Pickup" />
                      <div className="absolute bottom-6 right-6 h-3 w-3 rounded-full border-2 border-white bg-red-500" title="Destination" />
                      <svg className="absolute inset-0 h-full w-full" aria-hidden>
                        <path
                          d="M 40 100 Q 80 60 120 50 T 200 90"
                          fill="none"
                          stroke="#0ea5e9"
                          strokeWidth="2"
                          strokeDasharray="6 4"
                          opacity="0.8"
                        />
                      </svg>
                      <div className="landing-mini-car absolute bottom-8 left-1/3">
                        <Car className="h-5 w-5 text-sky-400" />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-slate-500">Est. fare</span>
                      <span className="font-semibold text-sky-400">$12.40</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mb-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Built for the city</h2>
            <p className="mt-3 text-slate-400">
              Everything you need for smooth rides — passengers and drivers alike.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`landing-feature-card group rounded-2xl border border-slate-700/50 bg-gradient-to-b ${f.accent} p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:border-slate-500/50`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/80 shadow-inner">
                  <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-20 rounded-3xl border border-slate-700/40 bg-slate-900/40 p-8 md:p-12">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">How Movee works</h2>
            <p className="mt-3 text-slate-400">From request to arrival in three simple steps</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative text-center md:text-left">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-gradient-to-r from-sky-500/50 to-transparent md:block" />
                )}
                <span className="text-4xl font-black text-slate-700">{s.step}</span>
                <div className="mt-2 mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20">
                  <s.icon className="h-5 w-5 text-sky-400" />
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="landing-cta relative mb-24 overflow-hidden rounded-3xl border border-sky-500/30 bg-gradient-to-r from-sky-600/20 via-slate-900/80 to-violet-600/20 px-6 py-14 text-center md:px-12">
          <div className="pointer-events-none absolute -right-8 -top-8 opacity-20">
            <Car className="h-32 w-32 text-sky-400" />
          </div>
          <h2 className="relative text-3xl font-bold md:text-4xl">
            Ready to move through your city?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-slate-400">
            Join Movee as a rider or driver. Sign up in minutes and experience real-time
            ride-sharing built for urban life.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/register?role=rider">
              <Button size="lg">Get started — Ride</Button>
            </Link>
            <Link href="/register?role=driver">
              <Button size="lg" variant="outline">
                Become a driver
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/50 py-10 text-center backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-sky-400" />
            <span className="font-semibold">
              Move<span className="text-sky-400">e</span>
            </span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Movee. Urban ride-sharing — real-time, transparent, yours.
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link href="/login" className="hover:text-sky-400">
              Log in
            </Link>
            <Link href="/register" className="hover:text-sky-400">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

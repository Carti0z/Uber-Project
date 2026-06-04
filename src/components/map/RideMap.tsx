"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

interface RideMapProps {
  pickup?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  driver?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number };
  className?: string;
  interactive?: boolean;
  followUser?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-xl bg-slate-800 text-slate-400">
      Loading map...
    </div>
  ),
});

export function RideMap(props: RideMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className={`min-h-[280px] rounded-xl bg-slate-800 ${props.className || ""}`} />
    );
  }
  return <MapInner {...props} />;
}

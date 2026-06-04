"use client";

/** Decorative city skyline + road with animated vehicles */
export function CityScene() {
  return (
    <div className="landing-city pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(45vh,380px)] overflow-hidden">
      {/* Ambient city glow */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-sky-500/15 via-violet-500/5 to-transparent" />

      {/* Road */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-slate-900/80">
        <div className="absolute left-0 right-0 top-6 h-px bg-slate-600/60" />
        <div className="absolute left-0 right-0 top-10 flex justify-around opacity-40">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-1 w-8 rounded-full bg-amber-400/80 landing-road-dash"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Moving vehicles */}
      <div className="absolute bottom-14 left-0 right-0 h-16">
        <div className="landing-car landing-car-1 absolute bottom-2">
          <CarSvg color="#0ea5e9" />
        </div>
        <div className="landing-car landing-car-2 absolute bottom-6">
          <CarSvg color="#f59e0b" small />
        </div>
        <div className="landing-car landing-car-3 absolute bottom-1">
          <CarSvg color="#a78bfa" />
        </div>
      </div>

      {/* Skyline */}
      <svg
        className="absolute bottom-20 w-[140%] min-w-[900px] -translate-x-[15%] text-slate-800"
        viewBox="0 0 1200 280"
        fill="currentColor"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="buildingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        {/* Back layer */}
        <rect x="40" y="120" width="70" height="160" fill="url(#buildingGrad)" opacity="0.7" />
        <rect x="130" y="80" width="90" height="200" fill="url(#buildingGrad)" opacity="0.65" />
        <rect x="240" y="140" width="55" height="140" fill="url(#buildingGrad)" opacity="0.7" />
        <rect x="310" y="60" width="110" height="220" fill="url(#buildingGrad)" opacity="0.8" />
        <rect x="440" y="100" width="75" height="180" fill="url(#buildingGrad)" opacity="0.7" />
        <rect x="530" y="40" width="130" height="240" fill="url(#buildingGrad)" />
        <rect x="680" y="90" width="85" height="190" fill="url(#buildingGrad)" opacity="0.75" />
        <rect x="780" y="110" width="60" height="170" fill="url(#buildingGrad)" opacity="0.7" />
        <rect x="860" y="50" width="120" height="230" fill="url(#buildingGrad)" opacity="0.85" />
        <rect x="1000" y="130" width="70" height="150" fill="url(#buildingGrad)" opacity="0.7" />
        <rect x="1090" y="95" width="95" height="185" fill="url(#buildingGrad)" opacity="0.75" />
        {/* Windows */}
        {[
          [560, 80], [580, 80], [600, 100], [620, 100], [560, 120], [600, 140],
          [880, 90], [900, 90], [920, 110], [900, 130], [340, 100], [360, 120],
        ].map(([x, y], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width="12"
            height="14"
            rx="1"
            className="landing-window"
            fill="#fbbf24"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
        ))}
        {/* Tower accent */}
        <polygon points="585,40 615,40 600,10" fill="#0ea5e9" opacity="0.5" />
      </svg>
    </div>
  );
}

function CarSvg({ color, small }: { color: string; small?: boolean }) {
  const w = small ? 56 : 72;
  const h = small ? 28 : 34;
  return (
    <svg width={w} height={h} viewBox="0 0 72 34" fill="none" aria-hidden>
      <ellipse cx="36" cy="30" rx="28" ry="4" fill="black" opacity="0.25" />
      <path
        d="M8 22h56l-6-12H22l-4-6H12l-4 6H8v12z"
        fill={color}
        opacity="0.95"
      />
      <path d="M20 10h24l5 8H15l5-8z" fill={color} filter="brightness(1.2)" />
      <rect x="24" y="12" width="10" height="6" rx="1" fill="#e0f2fe" opacity="0.9" />
      <rect x="38" y="12" width="10" height="6" rx="1" fill="#e0f2fe" opacity="0.9" />
      <circle cx="20" cy="24" r="6" fill="#1e293b" />
      <circle cx="20" cy="24" r="3" fill="#64748b" />
      <circle cx="52" cy="24" r="6" fill="#1e293b" />
      <circle cx="52" cy="24" r="3" fill="#64748b" />
      <circle cx="62" cy="16" r="2" fill="#fef08a" className="landing-headlight" />
    </svg>
  );
}

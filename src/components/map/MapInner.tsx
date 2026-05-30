"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const pickupIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const driverIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#0ea5e9;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

L.Marker.prototype.options.icon = defaultIcon;

function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapInnerProps {
  pickup?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  driver?: { lat: number; lng: number };
  className?: string;
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function MapInner({
  pickup,
  destination,
  driver,
  className,
  interactive,
  onMapClick,
}: MapInnerProps) {
  const center = pickup || destination || driver || { lat: 40.7128, lng: -74.006 };
  const points: [number, number][] = [];
  if (pickup) points.push([pickup.lat, pickup.lng]);
  if (driver) points.push([driver.lat, driver.lng]);
  if (destination) points.push([destination.lat, destination.lng]);
  if (!driver && pickup && destination) points.splice(1, 0);

  return (
    <div className={className || "h-[320px] w-full"}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom={interactive !== false}
        className="h-full w-full rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>Pickup</Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}
        {driver && (
          <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
            <Popup>Driver</Popup>
          </Marker>
        )}
        {points.length >= 2 && (
          <Polyline positions={points} color="#0ea5e9" weight={4} opacity={0.7} dashArray="8 8" />
        )}
      </MapContainer>
    </div>
  );
}

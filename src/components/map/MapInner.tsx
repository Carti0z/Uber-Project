"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
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

const userIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="position:relative;width:20px;height:20px"><div style="position:absolute;inset:0;background:#8b5cf6;border-radius:50%;opacity:.35;animation:pulse 2s infinite"></div><div style="position:absolute;inset:4px;background:#8b5cf6;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
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

function MapRecenter({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom ?? map.getZoom(), { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const pointsKey = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true });
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], animate: true });
  }, [points, pointsKey, map]);
  return null;
}

interface MapInnerProps {
  pickup?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  driver?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number };
  className?: string;
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  followUser?: boolean;
}

export default function MapInner({
  pickup,
  destination,
  driver,
  userLocation,
  className,
  interactive,
  onMapClick,
  followUser,
}: MapInnerProps) {
  const center =
    (followUser && userLocation) ||
    pickup ||
    userLocation ||
    destination ||
    driver || { lat: 40.7128, lng: -74.006 };

  const points: [number, number][] = [];
  if (pickup) points.push([pickup.lat, pickup.lng]);
  if (driver) points.push([driver.lat, driver.lng]);
  if (destination) points.push([destination.lat, destination.lng]);
  if (!driver && pickup && destination) points.splice(1, 0);
  if (userLocation) points.push([userLocation.lat, userLocation.lng]);

  const fitPoints = [...points];
  const recenterLat = followUser && userLocation ? userLocation.lat : center.lat;
  const recenterLng = followUser && userLocation ? userLocation.lng : center.lng;

  return (
    <div className={className || "h-[320px] w-full"}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={15}
        scrollWheelZoom={interactive !== false}
        className="h-full w-full rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitPoints.length >= 2 ? (
          <FitBounds points={fitPoints} />
        ) : (
          <MapRecenter lat={recenterLat} lng={recenterLng} zoom={15} />
        )}
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
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

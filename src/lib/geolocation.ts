export interface GeoCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function formatCoordsAsAddress(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function getCurrentPosition(
  options: PositionOptions = {}
): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        const messages: Record<number, string> = {
          1: "Location permission denied. Enable location in your browser settings.",
          2: "Location unavailable. Try again or move to an open area.",
          3: "Location request timed out. Please try again.",
        };
        reject(new Error(messages[err.code] || "Could not get your location"));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 15_000,
        ...options,
      }
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) throw new Error("Geocode failed");
    const data = (await res.json()) as { display_name?: string };
    return data.display_name?.trim() || formatCoordsAsAddress(lat, lng);
  } catch {
    return formatCoordsAsAddress(lat, lng);
  }
}

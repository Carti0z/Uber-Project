export async function api<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    let json: { error?: string };
    try {
      json = await res.json();
    } catch {
      return { error: res.ok ? "Invalid response from server" : `Request failed (${res.status})` };
    }
    if (!res.ok) return { error: json.error || "Something went wrong" };
    return { data: json as T };
  } catch {
    return { error: "Network error" };
  }
}

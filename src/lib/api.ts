export async function api<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || "Something went wrong" };
    return { data: json as T };
  } catch {
    return { error: "Network error" };
  }
}

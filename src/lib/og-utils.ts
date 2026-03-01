/**
 * OG metadata shape returned by /api/og-metadata
 */
export interface OgMetadata {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogSiteName: string | null;
}

const EMPTY_META: OgMetadata = {
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  ogSiteName: null,
};

/**
 * Fetch OG metadata for a URL via the /api/og-metadata endpoint.
 * Returns empty metadata on failure (never throws).
 */
export async function fetchOgMetadata(url: string): Promise<OgMetadata> {
  try {
    const res = await fetch("/api/og-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) return EMPTY_META;
    return await res.json();
  } catch {
    return EMPTY_META;
  }
}

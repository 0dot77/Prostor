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
 * Extract YouTube video ID and return a thumbnail URL.
 * Works client-side as a fallback when og_image is null in the DB.
 */
export function getYouTubeThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    let videoId: string | null = null;

    if ((host === "youtube.com" || host === "m.youtube.com") && u.searchParams.has("v")) {
      videoId = u.searchParams.get("v");
    } else if (host === "youtu.be") {
      videoId = u.pathname.slice(1).split("/")[0] || null;
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      const match = u.pathname.match(/\/(embed|shorts|v)\/([a-zA-Z0-9_-]+)/);
      videoId = match ? match[2] : null;
    }

    return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

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

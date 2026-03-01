import { NextResponse } from "next/server";
import ogs from "open-graph-scraper";
import { isUselessOgImage } from "@/lib/brand-utils";
import { OG_FETCH_TIMEOUT_MS } from "@/lib/constants";

/**
 * Extract YouTube video ID from various YouTube URL formats.
 */
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    // youtube.com/watch?v=ID
    if ((host === "youtube.com" || host === "m.youtube.com") && u.searchParams.has("v")) {
      return u.searchParams.get("v");
    }
    // youtu.be/ID
    if (host === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    // youtube.com/embed/ID or youtube.com/shorts/ID
    if (host === "youtube.com" || host === "m.youtube.com") {
      const match = u.pathname.match(/\/(embed|shorts|v)\/([a-zA-Z0-9_-]+)/);
      return match ? match[2] : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract tweet ID from an X.com / Twitter URL.
 */
function extractTweetId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");
    if (host !== "x.com" && host !== "twitter.com") return null;

    // Pattern: /user/status/1234567890
    const match = u.pathname.match(/\/\w+\/status\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Fetch tweet data from Twitter's syndication API.
 * This works without authentication and returns media thumbnails.
 */
async function fetchTweetMetadata(
  tweetId: string
): Promise<{
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogSiteName: string | null;
} | null> {
  try {
    const res = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=x`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(OG_FETCH_TIMEOUT_MS),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();

    // Extract media thumbnail
    let ogImage: string | null = null;
    if (data.mediaDetails && data.mediaDetails.length > 0) {
      ogImage = data.mediaDetails[0].media_url_https ?? null;
    }
    // Fallback: check photos in the tweet
    if (!ogImage && data.photos && data.photos.length > 0) {
      ogImage = data.photos[0].url ?? null;
    }

    // Build title from user name
    const userName = data.user?.name ?? null;
    const screenName = data.user?.screen_name ?? null;

    return {
      ogTitle: userName ? `${userName} (@${screenName})` : null,
      ogDescription: data.text ?? null,
      ogImage,
      ogSiteName: "X",
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Special handling for YouTube — extract thumbnail directly
    const youtubeId = extractYouTubeId(url);

    // Special handling for X.com / Twitter — use syndication API
    const tweetId = extractTweetId(url);
    if (tweetId) {
      const tweetMeta = await fetchTweetMetadata(tweetId);
      if (tweetMeta) {
        return NextResponse.json(tweetMeta);
      }
      // If syndication fails, fall through to generic OG scraping
    }

    // Generic OG scraping for all other sites
    const { result, error } = await ogs({ url, timeout: OG_FETCH_TIMEOUT_MS });

    if (error) {
      return NextResponse.json({
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogSiteName: null,
      });
    }

    // Extract the first image URL, filtering out useless ones
    let ogImage: string | null = null;
    if (result.ogImage && result.ogImage.length > 0) {
      const candidate = result.ogImage[0].url;
      ogImage = isUselessOgImage(candidate) ? null : candidate;
    }

    // YouTube fallback: if OG scraping didn't return an image, use the thumbnail API
    if (!ogImage && youtubeId) {
      ogImage = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    return NextResponse.json({
      ogTitle: result.ogTitle ?? null,
      ogDescription: result.ogDescription ?? null,
      ogImage,
      ogSiteName: result.ogSiteName ?? null,
    });
  } catch (error) {
    console.error("OG metadata error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}

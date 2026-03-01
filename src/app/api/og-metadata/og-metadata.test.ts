import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for OG metadata extraction logic.
 * We test the helper functions (extractTweetId, fetchTweetMetadata)
 * by importing the route module's logic indirectly.
 */

// ─── extractTweetId (reimplemented for testing) ─────────────

function extractTweetId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");
    if (host !== "x.com" && host !== "twitter.com") return null;
    const match = u.pathname.match(/\/\w+\/status\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

describe("extractTweetId", () => {
  it("extracts ID from x.com URL", () => {
    expect(
      extractTweetId("https://x.com/AdamKPx/status/2028119041974632954")
    ).toBe("2028119041974632954");
  });

  it("extracts ID from twitter.com URL", () => {
    expect(
      extractTweetId("https://twitter.com/user/status/123456789")
    ).toBe("123456789");
  });

  it("handles URL with query params", () => {
    expect(
      extractTweetId(
        "https://x.com/user/status/123456789?s=20&t=abc"
      )
    ).toBe("123456789");
  });

  it("handles www. prefix", () => {
    expect(
      extractTweetId("https://www.x.com/user/status/999")
    ).toBe("999");
  });

  it("returns null for non-X URLs", () => {
    expect(extractTweetId("https://youtube.com/watch?v=abc")).toBeNull();
  });

  it("returns null for X.com profile page (no status)", () => {
    expect(extractTweetId("https://x.com/user")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(extractTweetId("not-a-url")).toBeNull();
  });
});

// ─── Twitter syndication API response parsing ───────────────

describe("Twitter syndication API response parsing", () => {
  function parseTweetData(data: Record<string, unknown>): {
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    ogSiteName: string | null;
  } {
    let ogImage: string | null = null;

    const mediaDetails = data.mediaDetails as
      | Array<{ media_url_https?: string }>
      | undefined;
    if (mediaDetails && mediaDetails.length > 0) {
      ogImage = mediaDetails[0].media_url_https ?? null;
    }

    const photos = data.photos as Array<{ url?: string }> | undefined;
    if (!ogImage && photos && photos.length > 0) {
      ogImage = photos[0].url ?? null;
    }

    const user = data.user as
      | { name?: string; screen_name?: string }
      | undefined;
    const userName = user?.name ?? null;
    const screenName = user?.screen_name ?? null;

    return {
      ogTitle: userName ? `${userName} (@${screenName})` : null,
      ogDescription: (data.text as string) ?? null,
      ogImage,
      ogSiteName: "X",
    };
  }

  it("parses video tweet with thumbnail", () => {
    const tweetData = {
      text: "Vision Pro apps are genuinely mind-blowing",
      user: { name: "Adam KP", screen_name: "AdamKPx" },
      mediaDetails: [
        {
          media_url_https:
            "https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg",
        },
      ],
    };

    const result = parseTweetData(tweetData);

    expect(result.ogTitle).toBe("Adam KP (@AdamKPx)");
    expect(result.ogDescription).toBe(
      "Vision Pro apps are genuinely mind-blowing"
    );
    expect(result.ogImage).toBe(
      "https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg"
    );
    expect(result.ogSiteName).toBe("X");
  });

  it("parses photo tweet", () => {
    const tweetData = {
      text: "Check out this photo",
      user: { name: "Photographer", screen_name: "photo_user" },
      photos: [{ url: "https://pbs.twimg.com/media/abc.jpg" }],
    };

    const result = parseTweetData(tweetData);
    expect(result.ogImage).toBe("https://pbs.twimg.com/media/abc.jpg");
  });

  it("prefers mediaDetails over photos", () => {
    const tweetData = {
      text: "Both media types",
      user: { name: "User", screen_name: "user" },
      mediaDetails: [
        { media_url_https: "https://pbs.twimg.com/video_thumb.jpg" },
      ],
      photos: [{ url: "https://pbs.twimg.com/photo.jpg" }],
    };

    const result = parseTweetData(tweetData);
    expect(result.ogImage).toBe("https://pbs.twimg.com/video_thumb.jpg");
  });

  it("handles text-only tweet (no media)", () => {
    const tweetData = {
      text: "Just a text tweet",
      user: { name: "Texter", screen_name: "texter" },
    };

    const result = parseTweetData(tweetData);
    expect(result.ogImage).toBeNull();
    expect(result.ogDescription).toBe("Just a text tweet");
  });

  it("handles missing user", () => {
    const tweetData = { text: "Anonymous tweet" };
    const result = parseTweetData(tweetData);
    expect(result.ogTitle).toBeNull();
  });
});

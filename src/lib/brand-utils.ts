/**
 * Brand information for common websites.
 * Used as fallback when OG metadata is unavailable.
 */

export interface BrandInfo {
  name: string;
  color: string; // Background color for the icon area
  textColor: string; // Text color on the background
  icon: string; // Single character or emoji as icon fallback
}

const BRAND_MAP: Record<string, BrandInfo> = {
  // Social Media
  "x.com": { name: "X", color: "#000000", textColor: "#fff", icon: "𝕏" },
  "twitter.com": { name: "X", color: "#000000", textColor: "#fff", icon: "𝕏" },
  "instagram.com": { name: "Instagram", color: "#E1306C", textColor: "#fff", icon: "IG" },
  "facebook.com": { name: "Facebook", color: "#1877F2", textColor: "#fff", icon: "f" },
  "threads.net": { name: "Threads", color: "#000000", textColor: "#fff", icon: "@" },
  "tiktok.com": { name: "TikTok", color: "#000000", textColor: "#fff", icon: "♪" },
  "linkedin.com": { name: "LinkedIn", color: "#0A66C2", textColor: "#fff", icon: "in" },

  // Video
  "youtube.com": { name: "YouTube", color: "#FF0000", textColor: "#fff", icon: "▶" },
  "youtu.be": { name: "YouTube", color: "#FF0000", textColor: "#fff", icon: "▶" },
  "vimeo.com": { name: "Vimeo", color: "#1AB7EA", textColor: "#fff", icon: "▶" },
  "twitch.tv": { name: "Twitch", color: "#9146FF", textColor: "#fff", icon: "▶" },

  // Art / Design / Reference
  "behance.net": { name: "Behance", color: "#1769FF", textColor: "#fff", icon: "Bē" },
  "dribbble.com": { name: "Dribbble", color: "#EA4C89", textColor: "#fff", icon: "●" },
  "artstation.com": { name: "ArtStation", color: "#13AFF0", textColor: "#fff", icon: "AS" },
  "deviantart.com": { name: "DeviantArt", color: "#05CC47", textColor: "#fff", icon: "DA" },
  "pinterest.com": { name: "Pinterest", color: "#E60023", textColor: "#fff", icon: "P" },
  "pinterest.co.kr": { name: "Pinterest", color: "#E60023", textColor: "#fff", icon: "P" },
  "figma.com": { name: "Figma", color: "#F24E1E", textColor: "#fff", icon: "F" },
  "canva.com": { name: "Canva", color: "#00C4CC", textColor: "#fff", icon: "C" },
  "unsplash.com": { name: "Unsplash", color: "#000000", textColor: "#fff", icon: "U" },
  "pexels.com": { name: "Pexels", color: "#05A081", textColor: "#fff", icon: "P" },
  "flickr.com": { name: "Flickr", color: "#0063DC", textColor: "#fff", icon: "f" },

  // Dev / Docs
  "github.com": { name: "GitHub", color: "#24292F", textColor: "#fff", icon: "GH" },
  "notion.so": { name: "Notion", color: "#000000", textColor: "#fff", icon: "N" },
  "notion.site": { name: "Notion", color: "#000000", textColor: "#fff", icon: "N" },
  "medium.com": { name: "Medium", color: "#000000", textColor: "#fff", icon: "M" },
  "docs.google.com": { name: "Google Docs", color: "#4285F4", textColor: "#fff", icon: "G" },
  "drive.google.com": { name: "Google Drive", color: "#4285F4", textColor: "#fff", icon: "G" },
  "slides.google.com": { name: "Google Slides", color: "#FBBC04", textColor: "#000", icon: "G" },

  // Music
  "soundcloud.com": { name: "SoundCloud", color: "#FF5500", textColor: "#fff", icon: "☁" },
  "spotify.com": { name: "Spotify", color: "#1DB954", textColor: "#fff", icon: "♫" },
  "open.spotify.com": { name: "Spotify", color: "#1DB954", textColor: "#fff", icon: "♫" },

  // Other
  "wikipedia.org": { name: "Wikipedia", color: "#636466", textColor: "#fff", icon: "W" },
  "naver.com": { name: "Naver", color: "#03C75A", textColor: "#fff", icon: "N" },
  "blog.naver.com": { name: "Naver Blog", color: "#03C75A", textColor: "#fff", icon: "N" },
  "tistory.com": { name: "Tistory", color: "#F36F21", textColor: "#fff", icon: "T" },
  "brunch.co.kr": { name: "Brunch", color: "#000000", textColor: "#fff", icon: "B" },
};

/**
 * Get brand info from a URL.
 * Tries to match the hostname against known brands.
 */
export function getBrandInfo(url: string): BrandInfo | null {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");

    // Direct match
    if (BRAND_MAP[hostname]) return BRAND_MAP[hostname];

    // Try parent domain (e.g., "m.youtube.com" → "youtube.com")
    const parts = hostname.split(".");
    if (parts.length > 2) {
      const parent = parts.slice(-2).join(".");
      if (BRAND_MAP[parent]) return BRAND_MAP[parent];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get display domain from URL
 */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/**
 * Check if an OG image URL is a known useless placeholder/icon.
 * These are generic site icons rather than actual content images.
 */
const USELESS_OG_IMAGE_PATTERNS = [
  /abs-\d*\.twimg\.com\/emoji/,       // X.com warning emoji SVG
  /abs\.twimg\.com\/responsive-web/,   // X.com generic assets
  /\/static\/images\/project-logo/,    // generic project logos
  /\/favicon/i,                        // favicons used as OG image
];

export function isUselessOgImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return true;
  return USELESS_OG_IMAGE_PATTERNS.some((pattern) => pattern.test(imageUrl));
}

/**
 * Get a valid OG image, filtering out known useless ones.
 * Returns the image URL if valid, null otherwise.
 */
export function getValidOgImage(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (isUselessOgImage(imageUrl)) return null;
  return imageUrl;
}

/**
 * Generate a color from a string (for unknown sites)
 */
export function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

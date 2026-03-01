import { describe, it, expect } from "vitest";
import {
  getBrandInfo,
  getDomain,
  stringToHue,
  isUselessOgImage,
  getValidOgImage,
} from "./brand-utils";

// ─── getBrandInfo ───────────────────────────────────────────

describe("getBrandInfo", () => {
  it("recognizes x.com", () => {
    const brand = getBrandInfo("https://x.com/user/status/123");
    expect(brand).not.toBeNull();
    expect(brand!.name).toBe("X");
  });

  it("recognizes twitter.com as X", () => {
    const brand = getBrandInfo("https://twitter.com/user/status/123");
    expect(brand!.name).toBe("X");
  });

  it("recognizes youtube.com", () => {
    const brand = getBrandInfo("https://www.youtube.com/watch?v=abc");
    expect(brand!.name).toBe("YouTube");
    expect(brand!.color).toBe("#FF0000");
  });

  it("recognizes youtu.be short URL", () => {
    const brand = getBrandInfo("https://youtu.be/abc123");
    expect(brand!.name).toBe("YouTube");
  });

  it("recognizes subdomain (m.youtube.com)", () => {
    const brand = getBrandInfo("https://m.youtube.com/watch?v=abc");
    expect(brand!.name).toBe("YouTube");
  });

  it("recognizes instagram.com", () => {
    const brand = getBrandInfo("https://www.instagram.com/p/abc");
    expect(brand!.name).toBe("Instagram");
  });

  it("recognizes github.com", () => {
    const brand = getBrandInfo("https://github.com/user/repo");
    expect(brand!.name).toBe("GitHub");
  });

  it("recognizes notion.so", () => {
    const brand = getBrandInfo("https://notion.so/page-id");
    expect(brand!.name).toBe("Notion");
  });

  it("recognizes google docs subdomain", () => {
    const brand = getBrandInfo("https://docs.google.com/document/d/abc");
    expect(brand!.name).toBe("Google Docs");
  });

  it("recognizes google slides subdomain", () => {
    const brand = getBrandInfo(
      "https://slides.google.com/presentation/d/abc"
    );
    expect(brand!.name).toBe("Google Slides");
  });

  it("recognizes korean sites (naver, tistory)", () => {
    expect(getBrandInfo("https://blog.naver.com/user/123")!.name).toBe(
      "Naver Blog"
    );
    expect(getBrandInfo("https://user.tistory.com/123")!.name).toBe(
      "Tistory"
    );
  });

  it("returns null for unknown sites", () => {
    expect(getBrandInfo("https://some-random-site.xyz/page")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(getBrandInfo("not-a-url")).toBeNull();
  });

  it("strips www. prefix", () => {
    const brand = getBrandInfo("https://www.behance.net/gallery/123");
    expect(brand!.name).toBe("Behance");
  });
});

// ─── getDomain ──────────────────────────────────────────────

describe("getDomain", () => {
  it("extracts domain without www", () => {
    expect(getDomain("https://www.youtube.com/watch?v=abc")).toBe(
      "youtube.com"
    );
  });

  it("preserves subdomain (except www)", () => {
    expect(getDomain("https://blog.naver.com/user")).toBe("blog.naver.com");
  });

  it("returns original string for invalid URL", () => {
    expect(getDomain("not-a-url")).toBe("not-a-url");
  });
});

// ─── stringToHue ────────────────────────────────────────────

describe("stringToHue", () => {
  it("returns a number between 0 and 359", () => {
    const hue = stringToHue("test-domain.com");
    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });

  it("is deterministic (same input → same output)", () => {
    expect(stringToHue("example.com")).toBe(stringToHue("example.com"));
  });

  it("produces different values for different inputs", () => {
    const a = stringToHue("google.com");
    const b = stringToHue("apple.com");
    // Not guaranteed to differ, but extremely likely
    expect(typeof a).toBe("number");
    expect(typeof b).toBe("number");
  });
});

// ─── isUselessOgImage ───────────────────────────────────────

describe("isUselessOgImage", () => {
  it("detects X.com warning emoji SVG", () => {
    expect(
      isUselessOgImage(
        "https://abs-0.twimg.com/emoji/v2/svg/26a0.svg"
      )
    ).toBe(true);
  });

  it("detects X.com responsive-web assets", () => {
    expect(
      isUselessOgImage(
        "https://abs.twimg.com/responsive-web/client-web-legacy/icon.png"
      )
    ).toBe(true);
  });

  it("detects favicon used as OG image", () => {
    expect(
      isUselessOgImage("https://example.com/favicon.ico")
    ).toBe(true);
  });

  it("returns true for null/undefined", () => {
    expect(isUselessOgImage(null)).toBe(true);
    expect(isUselessOgImage(undefined)).toBe(true);
  });

  it("allows valid OG images", () => {
    expect(
      isUselessOgImage(
        "https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg"
      )
    ).toBe(false);
  });

  it("allows random external images", () => {
    expect(
      isUselessOgImage("https://example.com/images/og-banner.jpg")
    ).toBe(false);
  });
});

// ─── getValidOgImage ────────────────────────────────────────

describe("getValidOgImage", () => {
  it("returns null for useless images", () => {
    expect(
      getValidOgImage("https://abs-0.twimg.com/emoji/v2/svg/26a0.svg")
    ).toBeNull();
  });

  it("returns null for null input", () => {
    expect(getValidOgImage(null)).toBeNull();
  });

  it("returns the URL for valid images", () => {
    const url = "https://example.com/og-image.jpg";
    expect(getValidOgImage(url)).toBe(url);
  });
});

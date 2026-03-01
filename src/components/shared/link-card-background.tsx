"use client";

import { getBrandInfo, getDomain, stringToHue, getValidOgImage } from "@/lib/brand-utils";
import { getYouTubeThumbnail } from "@/lib/og-utils";

interface LinkCardBackgroundProps {
  url: string;
  ogImage: string | null;
  /** Font size for watermark icon. Defaults to 80px */
  watermarkSize?: string;
}

/**
 * Three-tier background for link cards:
 * 1. OG image (if valid)
 * 2. Brand color + brand icon watermark (if known brand)
 * 3. Hue-based color + domain initial watermark (fallback)
 */
export function LinkCardBackground({
  url,
  ogImage,
  watermarkSize = "80px",
}: LinkCardBackgroundProps) {
  const brand = getBrandInfo(url);
  const validImage = getValidOgImage(ogImage) ?? getYouTubeThumbnail(url);

  if (validImage) {
    return (
      <div className="absolute inset-0">
        <img
          src={validImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    );
  }

  if (brand) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ backgroundColor: brand.color }}
      >
        <span
          className="font-black opacity-10 select-none"
          style={{ fontSize: watermarkSize, color: brand.textColor }}
        >
          {brand.icon}
        </span>
      </div>
    );
  }

  const domain = getDomain(url);
  const hue = stringToHue(domain);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: `hsl(${hue}, 30%, 25%)` }}
    >
      <span
        className="font-black opacity-10 select-none"
        style={{ fontSize: watermarkSize, color: `hsl(${hue}, 40%, 70%)` }}
      >
        {domain.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

interface BrandBadgeProps {
  url: string;
  /** Badge size in px. Defaults to 28 (h-7 w-7) */
  size?: number;
}

/**
 * Brand icon badge — shows brand icon for known sites or domain initial for unknown.
 */
export function BrandBadge({ url, size = 28 }: BrandBadgeProps) {
  const brand = getBrandInfo(url);
  const domain = getDomain(url);

  const sizeStyle = { width: size, height: size };
  const fontSize = size <= 20 ? "9px" : "12px";

  if (brand) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full font-bold"
        style={{ ...sizeStyle, fontSize, backgroundColor: brand.color, color: brand.textColor }}
      >
        {brand.icon}
      </span>
    );
  }

  const hue = stringToHue(domain);

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{ ...sizeStyle, fontSize, backgroundColor: `hsl(${hue}, 35%, 40%)`, color: "#fff" }}
    >
      {domain.charAt(0).toUpperCase()}
    </span>
  );
}

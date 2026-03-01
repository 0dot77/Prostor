"use client";

import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBrandInfo, getDomain, stringToHue, getValidOgImage } from "@/lib/brand-utils";
import type { Resource } from "@/lib/types";

interface LinkCardProps {
  resource: Resource;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  deleting: boolean;
}

export function LinkCard({
  resource,
  isAdmin,
  onDelete,
  deleting,
}: LinkCardProps) {
  const brand = getBrandInfo(resource.url);
  const domain = getDomain(resource.url);
  const displayTitle = resource.og_title || brand?.name || domain;
  const validImage = getValidOgImage(resource.og_image);
  const hasImage = !!validImage;

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col overflow-hidden rounded-xl transition-shadow hover:shadow-xl"
      style={{ aspectRatio: "16 / 10" }}
    >
      {/* Background layer: OG image first, then brand color, then fallback */}
      {hasImage ? (
        <div className="absolute inset-0">
          <img
            src={validImage!}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : brand ? (
        /* No OG image, known brand — brand color + large watermark icon */
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: brand.color }}
        >
          <span
            className="text-[80px] font-black opacity-10 select-none"
            style={{ color: brand.textColor }}
          >
            {brand.icon}
          </span>
        </div>
      ) : (
        /* No image, unknown site — hue-based color */
        (() => {
          const hue = stringToHue(domain);
          return (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                backgroundColor: `hsl(${hue}, 30%, 25%)`,
              }}
            >
              <span
                className="text-[80px] font-black opacity-10 select-none"
                style={{ color: `hsl(${hue}, 40%, 70%)` }}
              >
                {domain.charAt(0).toUpperCase()}
              </span>
            </div>
          );
        })()
      )}

      {/* Gradient overlay — bottom half darkened */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.05) 100%)",
        }}
      />

      {/* Content — pinned to bottom */}
      <div className="relative mt-auto flex flex-col gap-1.5 p-4">
        {/* Brand icon + site name row */}
        <div className="flex items-center gap-2">
          {brand ? (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: brand.color, color: brand.textColor }}
            >
              {brand.icon}
            </span>
          ) : (
            (() => {
              const hue = stringToHue(domain);
              return (
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: `hsl(${hue}, 35%, 40%)`,
                    color: "#fff",
                  }}
                >
                  {domain.charAt(0).toUpperCase()}
                </span>
              );
            })()
          )}
          <span className="text-sm font-semibold text-white truncate">
            {brand?.name || domain}
          </span>
        </div>

        {/* Title / description */}
        <p className="text-[13px] text-white/75 line-clamp-2 leading-snug">
          {displayTitle}
        </p>
      </div>

      {/* Delete button (admin) */}
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-7 w-7 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(resource.id);
          }}
        >
          {deleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
    </a>
  );
}

"use client";

import { ExternalLink, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBrandInfo, getDomain, stringToHue } from "@/lib/brand-utils";
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
  const siteName = resource.og_site_name || brand?.name || domain;

  // Thumbnail rendering
  const renderThumbnail = () => {
    if (resource.og_image) {
      return (
        <div className="relative w-40 shrink-0">
          <img
            src={resource.og_image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      );
    }

    if (brand) {
      return (
        <div
          className="flex w-40 shrink-0 items-center justify-center"
          style={{ backgroundColor: brand.color, color: brand.textColor }}
        >
          <span className="text-2xl font-bold">{brand.icon}</span>
        </div>
      );
    }

    // Unknown site — generate a colored placeholder
    const hue = stringToHue(domain);
    return (
      <div
        className="flex w-40 shrink-0 items-center justify-center"
        style={{
          backgroundColor: `hsl(${hue}, 35%, 88%)`,
          color: `hsl(${hue}, 45%, 35%)`,
        }}
      >
        <span className="text-xl font-bold">
          {domain.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      {renderThumbnail()}

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-3 min-w-0">
        <div>
          <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {displayTitle}
          </p>
          {resource.og_description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {resource.og_description}
            </p>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/60">
            {siteName}
          </span>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(resource.id);
              }}
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </a>
  );
}

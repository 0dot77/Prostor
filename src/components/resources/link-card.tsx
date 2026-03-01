"use client";

import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkCardBackground, BrandBadge } from "@/components/shared/link-card-background";
import { getBrandInfo, getDomain } from "@/lib/brand-utils";
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

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col overflow-hidden rounded-xl transition-shadow hover:shadow-xl"
      style={{ aspectRatio: "16 / 10" }}
    >
      {/* Background */}
      <LinkCardBackground url={resource.url} ogImage={resource.og_image} />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.05) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative mt-auto flex flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2">
          <BrandBadge url={resource.url} />
          <span className="text-sm font-semibold text-white truncate">
            {brand?.name || domain}
          </span>
        </div>
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

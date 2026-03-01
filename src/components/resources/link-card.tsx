"use client";

import { useState } from "react";
import { ExternalLink, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  // Extract domain for display
  let domain = "";
  try {
    domain = new URL(resource.url).hostname.replace("www.", "");
  } catch {
    domain = resource.url;
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      {/* OG Image */}
      {resource.og_image ? (
        <div className="relative w-40 shrink-0">
          <img
            src={resource.og_image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex w-40 shrink-0 items-center justify-center bg-muted">
          <ExternalLink className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-3 min-w-0">
        <div>
          <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {resource.og_title || resource.url}
          </p>
          {resource.og_description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {resource.og_description}
            </p>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/60">
            {resource.og_site_name || domain}
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

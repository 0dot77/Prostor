"use client";

import { getIframeSrc } from "@/lib/slide-utils";
import type { Slide } from "@/lib/types";

interface SlideViewerProps {
  slide: Slide;
}

/**
 * Renders a slide in an iframe based on its source type.
 */
export function SlideViewer({ slide }: SlideViewerProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/20">
      <iframe
        src={getIframeSrc(slide)}
        className="h-full w-full border-0"
        allowFullScreen
        title={slide.title}
      />
    </div>
  );
}

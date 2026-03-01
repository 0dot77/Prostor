"use client";

import type { Slide, SlideSourceType } from "@/lib/types";

interface SlideViewerProps {
  slide: Slide;
}

/**
 * Renders a slide based on its source type:
 * - google_slides / google_drive_pdf: iframe embed
 * - pdf_url / pdf_upload: iframe with Google Docs Viewer fallback, or direct embed
 */
export function SlideViewer({ slide }: SlideViewerProps) {
  const sourceType = slide.source_type as SlideSourceType | null;

  // Google Slides or Google Drive PDF → direct iframe
  if (sourceType === "google_slides" || sourceType === "google_drive_pdf") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/20">
        <iframe
          src={slide.file_url}
          className="h-full w-full border-0"
          allowFullScreen
          title={slide.title}
        />
      </div>
    );
  }

  // PDF URL or uploaded PDF → use Google Docs Viewer as iframe
  // This works for any publicly accessible PDF
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(slide.file_url)}&embedded=true`;

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/20">
      <iframe
        src={viewerUrl}
        className="h-full w-full border-0"
        allowFullScreen
        title={slide.title}
      />
    </div>
  );
}

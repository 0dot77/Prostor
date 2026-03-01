import type { SlideSourceType } from "@/lib/types";

/**
 * Detect the source type from a URL:
 * - Google Slides presentation URL
 * - Google Drive PDF file URL
 * - Any other URL treated as direct PDF URL
 */
export function detectSourceType(url: string): SlideSourceType {
  if (
    url.includes("docs.google.com/presentation") ||
    url.includes("slides.google.com")
  ) {
    return "google_slides";
  }
  if (url.includes("drive.google.com")) {
    return "google_drive_pdf";
  }
  return "pdf_url";
}

/**
 * Convert various Google URLs to embeddable format
 */
export function toEmbedUrl(url: string, sourceType: SlideSourceType): string {
  if (sourceType === "google_slides") {
    return url
      .replace(/\/edit.*$/, "/embed")
      .replace(/\/pub.*$/, "/embed");
  }
  if (sourceType === "google_drive_pdf") {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  return url;
}

/**
 * Get the iframe src URL for a slide.
 * Google Slides/Drive use the file_url directly (already converted to embed format).
 * PDF URLs use Google Docs Viewer.
 */
export function getIframeSrc(slide: { file_url: string; source_type: SlideSourceType | null }): string {
  if (slide.source_type === "google_slides" || slide.source_type === "google_drive_pdf") {
    return slide.file_url;
  }
  return `https://docs.google.com/viewer?url=${encodeURIComponent(slide.file_url)}&embedded=true`;
}

/**
 * Human-readable label for a slide source type
 */
export function sourceLabel(type: SlideSourceType | null): string {
  switch (type) {
    case "google_slides": return "Google Slides";
    case "google_drive_pdf": return "Drive PDF";
    case "pdf_url": return "PDF 링크";
    case "pdf_upload": return "업로드";
    default: return "";
  }
}

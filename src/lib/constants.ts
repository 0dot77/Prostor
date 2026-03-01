// ── Storage ──────────────────────────────────────────────
export const STORAGE_BUCKETS = {
  ASSIGNMENTS: "assignments",
  SLIDES: "slides",
} as const;

// ── Image Processing ─────────────────────────────────────
export const IMAGE_CONFIG = {
  /** Max dimension for main image (server-side sharp) */
  MAIN_MAX_DIMENSION: 1920,
  /** WebP quality for main image */
  MAIN_QUALITY: 80,
  /** Max dimension for thumbnail */
  THUMB_MAX_DIMENSION: 400,
  /** WebP quality for thumbnail */
  THUMB_QUALITY: 70,
  /** Client-side max file size before compression (MB) */
  CLIENT_MAX_SIZE_MB: 2,
  /** Upload dialog max file size validation (bytes) */
  UPLOAD_MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
} as const;

// ── OG Metadata ──────────────────────────────────────────
export const OG_FETCH_TIMEOUT_MS = 10_000;

// ── PiP ──────────────────────────────────────────────────
export const PIP_WINDOW = {
  WIDTH: 800,
  HEIGHT: 520,
} as const;

// ── Whiteboard ───────────────────────────────────────────
export const WHITEBOARD_ROOM_PREFIX = "prostor-";

// ── Storage URL Pattern ──────────────────────────────────
/** Regex to extract the storage path from a Supabase public URL */
export function extractStoragePath(
  publicUrl: string,
  bucket: string
): string | null {
  const regex = new RegExp(
    `\\/storage\\/v1\\/object\\/public\\/${bucket}\\/(.*)`,
  );
  const match = publicUrl.match(regex);
  return match?.[1] ?? null;
}

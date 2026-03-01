import imageCompression from "browser-image-compression";
import { IMAGE_CONFIG } from "@/lib/constants";

/**
 * Client-side image compression before upload
 * Reduces file size significantly before sending to server
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: IMAGE_CONFIG.CLIENT_MAX_SIZE_MB,
    maxWidthOrHeight: IMAGE_CONFIG.MAIN_MAX_DIMENSION,
    useWebWorker: true,
    fileType: "image/webp" as const,
  };

  try {
    const compressed = await imageCompression(file, options);
    return compressed;
  } catch {
    // If compression fails, return original
    return file;
  }
}

/**
 * Generate a preview URL for a file (for upload dialog)
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

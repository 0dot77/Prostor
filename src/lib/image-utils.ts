import imageCompression from "browser-image-compression";

/**
 * Client-side image compression before upload
 * Reduces file size significantly before sending to server
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
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

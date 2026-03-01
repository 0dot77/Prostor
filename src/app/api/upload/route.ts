import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";
import { IMAGE_CONFIG, STORAGE_BUCKETS } from "@/lib/constants";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process with sharp: main image (WebP)
    const mainImage = await sharp(buffer)
      .resize(IMAGE_CONFIG.MAIN_MAX_DIMENSION, IMAGE_CONFIG.MAIN_MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_CONFIG.MAIN_QUALITY })
      .toBuffer();

    // Process with sharp: thumbnail (WebP)
    const thumbnail = await sharp(buffer)
      .resize(IMAGE_CONFIG.THUMB_MAX_DIMENSION, IMAGE_CONFIG.THUMB_MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_CONFIG.THUMB_QUALITY })
      .toBuffer();

    // Generate unique filenames
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 8);
    const mainPath = `${user.id}/${timestamp}-${randomId}.webp`;
    const thumbPath = `${user.id}/${timestamp}-${randomId}-thumb.webp`;

    // Use admin client to bypass Storage RLS
    const adminSupabase = createAdminClient();

    // Upload to Supabase Storage
    const { error: mainError } = await adminSupabase.storage
      .from(STORAGE_BUCKETS.ASSIGNMENTS)
      .upload(mainPath, mainImage, {
        contentType: "image/webp",
        upsert: false,
      });

    if (mainError) {
      console.error("Main image upload error:", mainError);
      return NextResponse.json(
        { error: `Failed to upload main image: ${mainError.message}` },
        { status: 500 }
      );
    }

    const { error: thumbError } = await adminSupabase.storage
      .from(STORAGE_BUCKETS.ASSIGNMENTS)
      .upload(thumbPath, thumbnail, {
        contentType: "image/webp",
        upsert: false,
      });

    if (thumbError) {
      console.error("Thumbnail upload error:", thumbError);
      return NextResponse.json(
        { error: `Failed to upload thumbnail: ${thumbError.message}` },
        { status: 500 }
      );
    }

    // Get public URLs
    const {
      data: { publicUrl: imageUrl },
    } = adminSupabase.storage.from(STORAGE_BUCKETS.ASSIGNMENTS).getPublicUrl(mainPath);

    const {
      data: { publicUrl: thumbnailUrl },
    } = adminSupabase.storage.from(STORAGE_BUCKETS.ASSIGNMENTS).getPublicUrl(thumbPath);

    return NextResponse.json({ imageUrl, thumbnailUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}

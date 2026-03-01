import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Creates a signed upload URL for the client to upload PDF directly to Storage.
 * This avoids the Next.js body parser size limitation.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: "fileName is required" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 8);
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${user.id}/${timestamp}-${randomId}-${safeName}`;

    const adminSupabase = createAdminClient();

    // Create signed upload URL (valid for 120 seconds)
    const { data: signedData, error: signError } = await adminSupabase.storage
      .from("slides")
      .createSignedUploadUrl(storagePath);

    if (signError || !signedData) {
      console.error("Signed URL error:", signError);
      return NextResponse.json(
        { error: `Failed to create upload URL: ${signError?.message}` },
        { status: 500 }
      );
    }

    // Also get the public URL for after upload
    const {
      data: { publicUrl },
    } = adminSupabase.storage.from("slides").getPublicUrl(storagePath);

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      path: signedData.path,
      publicUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Upload URL error:", message, error);
    return NextResponse.json(
      { error: `Failed to create upload URL: ${message}` },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKETS } from "@/lib/constants";

/**
 * Delete files from Supabase Storage (admin only).
 * Moves storage deletion logic to server-side to avoid exposing service role key.
 */
export async function POST(request: Request) {
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
    const { bucket, paths } = await request.json();

    if (!bucket || !paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { error: "bucket and paths[] are required" },
        { status: 400 }
      );
    }

    // Validate bucket name
    const validBuckets = Object.values(STORAGE_BUCKETS);
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: `Invalid bucket: ${bucket}` },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.storage.from(bucket).remove(paths);

    if (error) {
      console.error("Storage delete error:", error);
      return NextResponse.json(
        { error: `Failed to delete: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Delete storage error:", message);
    return NextResponse.json(
      { error: `Failed to delete files: ${message}` },
      { status: 500 }
    );
  }
}

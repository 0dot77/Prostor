import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Emails that should be automatically granted admin role
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "yty0706@gmail.com")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const email = user.email ?? "";
        const isAdmin = ADMIN_EMAILS.includes(email);

        // Use admin client to bypass RLS for user upsert
        const adminSupabase = createAdminClient();
        await adminSupabase.from("users").upsert(
          {
            id: user.id,
            email,
            name: user.user_metadata?.full_name ?? null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
            role: isAdmin ? "admin" : "student",
          },
          { onConflict: "id" }
        );

        const redirectTo = isAdmin ? "/admin/courses" : next;
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

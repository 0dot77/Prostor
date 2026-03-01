import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";

export interface AuthenticatedUser {
  /** Supabase auth user ID */
  id: string;
  /** User profile from the `users` table */
  profile: User;
  /** Whether the user has admin role */
  isAdmin: boolean;
}

/**
 * Get the authenticated user's profile in a server component.
 * Redirects to /login if not authenticated.
 *
 * @param selectFields - optional column selection for the profile query (default: "*")
 */
export async function getAuthenticatedUser(
  selectFields: string = "*"
): Promise<AuthenticatedUser> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select(selectFields)
    .eq("id", authUser.id)
    .single();

  const fallbackProfile: User = {
    id: authUser.id,
    email: authUser.email ?? "",
    name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
    avatar_url: authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? null,
    role: "student" as const,
    created_at: new Date().toISOString(),
  };

  const userProfile = profile ? (profile as unknown as User) : fallbackProfile;

  return {
    id: authUser.id,
    profile: userProfile,
    isAdmin: userProfile.role === "admin",
  };
}

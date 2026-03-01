import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";
import type { Course } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get enrolled courses
  const { data: enrollments } = await supabase
    .from("course_members")
    .select(
      `
      *,
      courses (*)
    `
    )
    .eq("user_id", user.id);

  const courses = (
    enrollments?.map((e: { courses: Course }) => e.courses).filter(Boolean) ??
    []
  ) as Course[];

  return (
    <DashboardClient
      user={
        profile ?? {
          id: user.id,
          email: user.email ?? "",
          name:
            user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatar_url:
            user.user_metadata?.avatar_url ??
            user.user_metadata?.picture ??
            null,
          role: "student" as const,
          created_at: new Date().toISOString(),
        }
      }
      courses={courses}
    />
  );
}

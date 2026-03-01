import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { DashboardClient } from "./dashboard-client";
import type { Course } from "@/lib/types";

export default async function DashboardPage() {
  const { id: userId, profile } = await getAuthenticatedUser();

  const supabase = await createClient();

  // Get enrolled courses
  const { data: enrollments } = await supabase
    .from("course_members")
    .select(
      `
      *,
      courses (*)
    `
    )
    .eq("user_id", userId);

  const courses = (
    enrollments?.map((e: { courses: Course }) => e.courses).filter(Boolean) ??
    []
  ) as Course[];

  return <DashboardClient user={profile} courses={courses} />;
}

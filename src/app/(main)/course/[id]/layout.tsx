import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { CourseSidebar } from "@/components/layout/course-sidebar";
import type { Course } from "@/lib/types";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function CourseLayout({ children, params }: LayoutProps) {
  const { id: courseId } = await params;
  const { id: userId, profile, isAdmin } = await getAuthenticatedUser();

  const supabase = await createClient();

  // Get course
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  // Check membership (admin can access all)
  if (!isAdmin) {
    const { data: membership } = await supabase
      .from("course_members")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .single();

    if (!membership) redirect("/dashboard");
  }

  return (
    <div className="flex h-screen">
      <CourseSidebar course={course as Course} user={profile} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

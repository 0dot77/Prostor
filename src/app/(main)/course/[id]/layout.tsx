import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseSidebar } from "@/components/layout/course-sidebar";
import type { User, Course } from "@/lib/types";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function CourseLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  // Get course
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (!course) notFound();

  // Check membership (admin can access all)
  if (profile?.role !== "admin") {
    const { data: membership } = await supabase
      .from("course_members")
      .select("id")
      .eq("course_id", id)
      .eq("user_id", authUser.id)
      .single();

    if (!membership) redirect("/dashboard");
  }

  const user: User = profile ?? {
    id: authUser.id,
    email: authUser.email ?? "",
    name: authUser.user_metadata?.full_name ?? null,
    avatar_url: authUser.user_metadata?.avatar_url ?? null,
    role: "student" as const,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="flex h-screen">
      <CourseSidebar course={course as Course} user={user} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

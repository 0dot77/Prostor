import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignmentsClient } from "./assignments-client";
import type { Week, AssignmentWithUser } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssignmentsPage({ params }: PageProps) {
  const { id: courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", authUser.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // Get weeks for this course
  const { data: weeks } = await supabase
    .from("weeks")
    .select("*")
    .eq("course_id", courseId)
    .order("week_number", { ascending: true });

  // Get all assignments for this course (through weeks)
  const weekIds = (weeks ?? []).map((w) => w.id);

  let assignments: AssignmentWithUser[] = [];

  if (weekIds.length > 0) {
    const { data } = await supabase
      .from("assignments")
      .select("*, users:user_id(id, name, avatar_url)")
      .in("week_id", weekIds)
      .order("created_at", { ascending: false });

    assignments = (data as AssignmentWithUser[]) ?? [];
  }

  return (
    <AssignmentsClient
      courseId={courseId}
      weeks={(weeks as Week[]) ?? []}
      assignments={assignments}
      currentUserId={authUser.id}
      isAdmin={isAdmin}
    />
  );
}

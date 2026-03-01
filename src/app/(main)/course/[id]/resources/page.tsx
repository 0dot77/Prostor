import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResourcesClient } from "./resources-client";
import type { Week, Resource } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResourcesPage({ params }: PageProps) {
  const { id: courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", authUser.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // Get weeks
  const { data: weeks } = await supabase
    .from("weeks")
    .select("*")
    .eq("course_id", courseId)
    .order("week_number", { ascending: true });

  // Get resources
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  return (
    <ResourcesClient
      courseId={courseId}
      weeks={(weeks as Week[]) ?? []}
      resources={(resources as Resource[]) ?? []}
      isAdmin={isAdmin}
    />
  );
}

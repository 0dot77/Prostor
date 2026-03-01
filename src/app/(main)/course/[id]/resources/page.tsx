import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { ResourcesClient } from "./resources-client";
import type { Week, Resource } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResourcesPage({ params }: PageProps) {
  const { id: courseId } = await params;
  const { isAdmin } = await getAuthenticatedUser();

  const supabase = await createClient();

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

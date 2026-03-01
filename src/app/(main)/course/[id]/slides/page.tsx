import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SlidesClient } from "./slides-client";
import type { Week, Slide } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SlidesPage({ params }: PageProps) {
  const { id: courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  // Check admin role
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

  // Get slides through weeks
  const weekIds = (weeks ?? []).map((w) => w.id);
  let slides: Slide[] = [];

  if (weekIds.length > 0) {
    const { data } = await supabase
      .from("slides")
      .select("*")
      .in("week_id", weekIds)
      .order("created_at", { ascending: true });

    slides = (data as Slide[]) ?? [];
  }

  return (
    <SlidesClient
      weeks={(weeks as Week[]) ?? []}
      slides={slides}
      isAdmin={isAdmin}
    />
  );
}

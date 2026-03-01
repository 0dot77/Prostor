import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "@/components/admin/course-form";
import { WeekManager } from "@/components/admin/week-manager";
import { MemberManager } from "@/components/admin/member-manager";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { Course, Week, CourseMemberWithUser } from "@/lib/types";
import { DeleteCourseButton } from "./delete-course-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCourseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (!course) notFound();

  const { data: weeks } = await supabase
    .from("weeks")
    .select("*")
    .eq("course_id", id)
    .order("week_number");

  const { data: members } = await supabase
    .from("course_members")
    .select("*, users(*)")
    .eq("course_id", id)
    .order("enrolled_at");

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-muted-foreground">강의 상세 관리</p>
        </div>
        <DeleteCourseButton courseId={id} />
      </div>

      <div className="flex flex-col gap-10">
        {/* Course Info */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>
          <CourseForm course={course as Course} userId={user.id} />
        </section>

        <Separator />

        {/* Weeks */}
        <section>
          <WeekManager
            courseId={id}
            weeks={(weeks as Week[]) ?? []}
          />
        </section>

        <Separator />

        {/* Members */}
        <section>
          <MemberManager
            courseId={id}
            members={(members as CourseMemberWithUser[]) ?? []}
          />
        </section>
      </div>
    </div>
  );
}

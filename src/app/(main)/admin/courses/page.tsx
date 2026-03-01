import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Course } from "@/lib/types";

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">강의 관리</h1>
          <p className="text-sm text-muted-foreground">
            강의와 워크숍을 관리합니다.
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            새 강의
          </Button>
        </Link>
      </div>

      {!courses || courses.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            아직 강의가 없습니다. 새 강의를 만들어보세요.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(courses as Course[]).map((course) => (
            <Link
              key={course.id}
              href={`/admin/courses/${course.id}`}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{course.title}</span>
                {course.description && (
                  <span className="text-sm text-muted-foreground">
                    {course.description}
                  </span>
                )}
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                {course.type === "workshop" ? "워크숍" : "강의"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

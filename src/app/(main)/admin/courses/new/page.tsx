import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "@/components/admin/course-form";

export default async function NewCoursePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">새 강의 만들기</h1>
        <p className="text-sm text-muted-foreground">
          새로운 강의 또는 워크숍을 생성합니다.
        </p>
      </div>
      <CourseForm userId={user.id} />
    </div>
  );
}

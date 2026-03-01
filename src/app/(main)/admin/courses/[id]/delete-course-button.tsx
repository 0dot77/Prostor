"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("이 강의를 삭제하시겠습니까? 모든 주차, 과제, 슬라이드가 함께 삭제됩니다.")) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("courses").delete().eq("id", courseId);

    if (!error) {
      router.push("/admin/courses");
      router.refresh();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

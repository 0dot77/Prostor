"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Course, CourseType } from "@/lib/types";

interface CourseFormProps {
  course?: Course;
  userId: string;
}

export function CourseForm({ course, userId }: CourseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [type, setType] = useState<CourseType>(course?.type ?? "course");
  const [startDate, setStartDate] = useState(course?.start_date ?? "");
  const [endDate, setEndDate] = useState(course?.end_date ?? "");

  const isEdit = !!course;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const courseData = {
      title,
      description: description || null,
      type,
      start_date: startDate || null,
      end_date: endDate || null,
      ...(isEdit ? {} : { created_by: userId }),
    };

    if (isEdit) {
      const { error } = await supabase
        .from("courses")
        .update(courseData)
        .eq("id", course.id);

      if (error) {
        console.error("Failed to update course:", error);
        setLoading(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("courses")
        .insert(courseData)
        .select()
        .single();

      if (error) {
        console.error("Failed to create course:", error);
        setLoading(false);
        return;
      }

      // Auto-create a whiteboard for this course
      if (data) {
        await supabase.from("whiteboards").insert({
          course_id: data.id,
          title: "Whiteboard",
          room_id: `prostor-${data.id}`,
        });

        // Enroll creator as instructor
        await supabase.from("course_members").insert({
          course_id: data.id,
          user_id: userId,
          role: "instructor",
        });
      }
    }

    setLoading(false);
    router.push(isEdit ? `/admin/courses/${course.id}` : "/admin/courses");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">강의명 *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="디자인 워크숍 2026"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="강의에 대한 간단한 설명"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="type">유형</Label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as CourseType)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="course">강의</option>
          <option value="workshop">워크숍</option>
        </select>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="start_date">시작일</Label>
          <Input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="end_date">종료일</Label>
          <Input
            id="end_date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !title}>
          {loading ? "저장 중..." : isEdit ? "수정" : "생성"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

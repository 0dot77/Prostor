"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { Week } from "@/lib/types";

interface WeekManagerProps {
  courseId: string;
  weeks: Week[];
}

export function WeekManager({ courseId, weeks: initialWeeks }: WeekManagerProps) {
  const router = useRouter();
  const [weeks, setWeeks] = useState<Week[]>(initialWeeks);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddWeek = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const nextNumber = weeks.length > 0
      ? Math.max(...weeks.map((w) => w.week_number)) + 1
      : 1;

    const { data, error } = await supabase
      .from("weeks")
      .insert({
        course_id: courseId,
        week_number: nextNumber,
        title: newTitle.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setWeeks([...weeks, data as Week]);
      setNewTitle("");
    }
    setLoading(false);
    router.refresh();
  };

  const handleDeleteWeek = async (weekId: string) => {
    if (!confirm("이 주차를 삭제하시겠습니까? 관련된 과제, 슬라이드도 삭제됩니다.")) return;

    const supabase = createClient();
    const { error } = await supabase.from("weeks").delete().eq("id", weekId);

    if (!error) {
      setWeeks(weeks.filter((w) => w.id !== weekId));
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">주차 관리</h3>

      {weeks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 주차가 없습니다. 첫 번째 주차를 추가해보세요.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {weeks
            .sort((a, b) => a.week_number - b.week_number)
            .map((week) => (
              <div
                key={week.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {week.week_number}주차
                  </span>
                  <span className="text-sm">{week.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteWeek(week.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="주차 제목 (예: 기초 이론)"
          onKeyDown={(e) => e.key === "Enter" && handleAddWeek()}
        />
        <Button
          onClick={handleAddWeek}
          disabled={loading || !newTitle.trim()}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

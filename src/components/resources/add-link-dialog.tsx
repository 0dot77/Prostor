"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { fetchOgMetadata } from "@/lib/og-utils";
import type { Week } from "@/lib/types";

interface AddLinkDialogProps {
  courseId: string;
  weeks: Week[];
}

export function AddLinkDialog({ courseId, weeks }: AddLinkDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [weekId, setWeekId] = useState<string>("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!url.trim()) return;
    setAdding(true);

    try {
      const meta = await fetchOgMetadata(url.trim());

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("resources").insert({
        course_id: courseId,
        week_id: weekId || null,
        url: url.trim(),
        og_title: meta.ogTitle,
        og_description: meta.ogDescription,
        og_image: meta.ogImage,
        og_site_name: meta.ogSiteName,
        added_by: user?.id ?? null,
      });

      if (error) throw error;

      setUrl("");
      setWeekId("");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Add link error:", error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          링크 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>수업 자료 추가</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>URL *</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>주차 분류 (선택)</Label>
            <select
              value={weekId}
              onChange={(e) => setWeekId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">전체 (주차 미지정)</option>
              {weeks.map((week) => (
                <option key={week.id} value={week.id}>
                  {week.week_number}주차 - {week.title}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleAdd} disabled={adding || !url.trim()} className="w-full">
            {adding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                추가 중...
              </>
            ) : (
              "추가"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

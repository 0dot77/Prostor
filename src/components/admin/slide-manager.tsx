"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Plus, Trash2, Loader2, Upload } from "lucide-react";
import type { Week, Slide } from "@/lib/types";

interface SlideManagerProps {
  courseId: string;
  weeks: Week[];
  slides: Slide[];
}

export function SlideManager({ courseId, weeks, slides }: SlideManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [weekId, setWeekId] = useState(weeks[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file || !weekId || !title.trim()) return;
    setUploading(true);

    try {
      // Upload PDF
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { fileUrl } = await uploadRes.json();

      // Create slide record
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("slides").insert({
        week_id: weekId,
        title: title.trim(),
        file_url: fileUrl,
        uploaded_by: user?.id ?? null,
      });

      if (error) throw error;

      setTitle("");
      setFile(null);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Slide upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (slideId: string) => {
    setDeleting(slideId);
    try {
      const supabase = createClient();

      // Find the slide to get storage path
      const slide = slides.find((s) => s.id === slideId);
      if (slide) {
        const match = slide.file_url.match(
          /\/storage\/v1\/object\/public\/slides\/(.*)/
        );
        if (match?.[1]) {
          await supabase.storage.from("slides").remove([match[1]]);
        }
      }

      const { error } = await supabase
        .from("slides")
        .delete()
        .eq("id", slideId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Delete slide error:", error);
    } finally {
      setDeleting(null);
    }
  };

  // Group slides by week
  const slidesByWeek = weeks.map((week) => ({
    week,
    slides: slides.filter((s) => s.week_id === week.id),
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">슬라이드 관리</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" disabled={weeks.length === 0}>
              <Plus className="h-4 w-4" />
              슬라이드 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>슬라이드 업로드</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>주차 선택 *</Label>
                <select
                  value={weekId}
                  onChange={(e) => setWeekId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {weeks.map((week) => (
                    <option key={week.id} value={week.id}>
                      {week.week_number}주차 - {week.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>제목 *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="슬라이드 제목"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>PDF 파일 *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="flex-1"
                  />
                </div>
                {file && (
                  <p className="text-xs text-muted-foreground">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                  </p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading || !file || !weekId || !title.trim()}
                className="w-full gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    업로드
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {weeks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          먼저 주차를 추가해주세요.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {slidesByWeek.map(({ week, slides: weekSlides }) => (
            <div key={week.id}>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {week.week_number}주차 - {week.title}
              </h3>
              {weekSlides.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 ml-2">
                  등록된 슬라이드가 없습니다.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {weekSlides.map((slide) => (
                    <div
                      key={slide.id}
                      className="flex items-center gap-3 rounded-md border px-3 py-2"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-sm truncate">
                        {slide.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        disabled={deleting === slide.id}
                        onClick={() => handleDelete(slide.id)}
                      >
                        {deleting === slide.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
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
import { FileText, Plus, Trash2, Loader2, Link2, Upload, Eye } from "lucide-react";
import { SlidePreviewPanel } from "./slide-preview-panel";
import type { Week, Slide, SlideSourceType } from "@/lib/types";

interface SlideManagerProps {
  courseId: string;
  weeks: Week[];
  slides: Slide[];
}

/**
 * Detect the source type from a URL:
 * - Google Slides presentation URL
 * - Google Drive PDF file URL
 * - Any other URL treated as direct PDF URL
 */
function detectSourceType(url: string): SlideSourceType {
  if (
    url.includes("docs.google.com/presentation") ||
    url.includes("slides.google.com")
  ) {
    return "google_slides";
  }
  if (url.includes("drive.google.com")) {
    return "google_drive_pdf";
  }
  return "pdf_url";
}

/**
 * Convert various Google URLs to embeddable format
 */
function toEmbedUrl(url: string, sourceType: SlideSourceType): string {
  if (sourceType === "google_slides") {
    // Convert /edit or /pub to /embed
    return url
      .replace(/\/edit.*$/, "/embed")
      .replace(/\/pub.*$/, "/embed");
  }
  if (sourceType === "google_drive_pdf") {
    // Extract file ID from various Drive URL formats
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  return url;
}

export function SlideManager({ courseId, weeks, slides: initialSlides }: SlideManagerProps) {
  const router = useRouter();
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewSlide, setPreviewSlide] = useState<Slide | null>(null);

  // Form state
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [title, setTitle] = useState("");
  const [weekId, setWeekId] = useState(weeks[0]?.id ?? "");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setSlides(initialSlides);
  }, [initialSlides]);

  const handleSubmit = async () => {
    if (!weekId || !title.trim()) return;
    setLoading(true);

    try {
      let fileUrl: string;
      let sourceType: SlideSourceType;

      if (mode === "link") {
        if (!url.trim()) return;
        sourceType = detectSourceType(url.trim());
        fileUrl = toEmbedUrl(url.trim(), sourceType);
      } else {
        // PDF upload via signed URL
        if (!file) return;

        const urlRes = await fetch("/api/upload-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name }),
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok) throw new Error(urlData.error || "Failed to get upload URL");

        const uploadRes = await fetch(urlData.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/pdf" },
          body: file,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload PDF");

        fileUrl = urlData.publicUrl;
        sourceType = "pdf_upload";
      }

      // Create slide record
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("slides").insert({
        week_id: weekId,
        title: title.trim(),
        file_url: fileUrl,
        source_type: sourceType,
        uploaded_by: user?.id ?? null,
      });

      if (error) throw error;

      // Reset
      setTitle("");
      setUrl("");
      setFile(null);
      setOpen(false);
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "알 수 없는 오류";
      console.error("Slide error:", msg);
      alert(`실패: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slideId: string) => {
    setDeleting(slideId);
    try {
      const supabase = createClient();
      const slide = slides.find((s) => s.id === slideId);

      // Delete storage file if it was uploaded
      if (slide?.source_type === "pdf_upload" && slide.file_url) {
        const match = slide.file_url.match(
          /\/storage\/v1\/object\/public\/slides\/(.*)/
        );
        if (match?.[1]) {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const adminSupabase = createAdminClient();
          await adminSupabase.storage.from("slides").remove([match[1]]);
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

  const sourceLabel = (type: SlideSourceType | null) => {
    switch (type) {
      case "google_slides": return "Google Slides";
      case "google_drive_pdf": return "Drive PDF";
      case "pdf_url": return "PDF 링크";
      case "pdf_upload": return "업로드";
      default: return "";
    }
  };

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
              <DialogTitle>슬라이드 추가</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={mode === "link" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("link")}
                  className="flex-1 gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  링크
                </Button>
                <Button
                  variant={mode === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("upload")}
                  className="flex-1 gap-2"
                >
                  <Upload className="h-4 w-4" />
                  PDF 업로드
                </Button>
              </div>

              {/* Week */}
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

              {/* Title */}
              <div className="flex flex-col gap-2">
                <Label>제목 *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="슬라이드 제목"
                />
              </div>

              {/* Link or Upload */}
              {mode === "link" ? (
                <div className="flex flex-col gap-2">
                  <Label>URL *</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Google Slides, Drive PDF, 또는 PDF 링크"
                  />
                  <p className="text-xs text-muted-foreground">
                    Google Slides 공유 링크, Google Drive PDF 공유 링크, 또는 직접 PDF URL
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label>PDF 파일 *</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {file && (
                    <p className="text-xs text-muted-foreground">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !weekId ||
                  !title.trim() ||
                  (mode === "link" ? !url.trim() : !file)
                }
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  "추가"
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
                      {slide.source_type && (
                        <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                          {sourceLabel(slide.source_type)}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPreviewSlide(slide)}
                        title="프리뷰"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
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

      {/* Preview Panel */}
      <SlidePreviewPanel
        slide={previewSlide}
        onClose={() => setPreviewSlide(null)}
      />
    </div>
  );
}

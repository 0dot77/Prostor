"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import type { Week } from "@/lib/types";

interface UploadDialogProps {
  weeks: Week[];
  courseId: string;
}

export function UploadDialog({ weeks, courseId }: UploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weekId, setWeekId] = useState(weeks[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleClearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!file || !weekId) return;
    setLoading(true);

    try {
      // Client-side compression
      const compressed = await compressImage(file);

      // Upload to server
      const formData = new FormData();
      formData.append("file", compressed);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const { imageUrl, thumbnailUrl } = await uploadRes.json();

      // Create assignment record
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("assignments").insert({
        week_id: weekId,
        user_id: user.id,
        title: title || null,
        description: description || null,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
      });

      if (error) throw error;

      // Reset and close
      handleClearFile();
      setTitle("");
      setDescription("");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          업로드
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>과제 업로드</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Week Selection */}
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

          {/* Dropzone */}
          {!preview ? (
            <div
              {...getRootProps()}
              className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? "여기에 놓으세요"
                  : "클릭하거나 이미지를 드래그하세요"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                PNG, JPG, GIF, WebP (최대 10MB)
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="h-48 w-full rounded-lg object-cover"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7"
                onClick={handleClearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label>제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="과제 제목 (선택)"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label>설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="간단한 설명 (선택)"
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !file || !weekId}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                업로드 중...
              </>
            ) : (
              "제출하기"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

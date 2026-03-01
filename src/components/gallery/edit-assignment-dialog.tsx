"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { AssignmentWithUser } from "@/lib/types";

interface EditAssignmentDialogProps {
  assignment: AssignmentWithUser | null;
  onClose: () => void;
}

export function EditAssignmentDialog({
  assignment,
  onClose,
}: EditAssignmentDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title ?? "");
      setDescription(assignment.description ?? "");
    }
  }, [assignment]);

  const handleSubmit = async () => {
    if (!assignment) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("assignments")
        .update({
          title: title || null,
          description: description || null,
        })
        .eq("id", assignment.id);

      if (error) throw error;

      onClose();
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!assignment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>과제 수정</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Preview */}
          {assignment && (
            <img
              src={assignment.thumbnail_url}
              alt="Preview"
              className="h-32 w-full rounded-lg object-cover"
            />
          )}

          <div className="flex flex-col gap-2">
            <Label>제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="과제 제목 (선택)"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="간단한 설명 (선택)"
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

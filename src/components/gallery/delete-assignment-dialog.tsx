"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { AssignmentWithUser } from "@/lib/types";

interface DeleteAssignmentDialogProps {
  assignment: AssignmentWithUser | null;
  onClose: () => void;
}

export function DeleteAssignmentDialog({
  assignment,
  onClose,
}: DeleteAssignmentDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!assignment) return;
    setLoading(true);

    try {
      const supabase = createClient();

      // Extract storage paths from URLs
      const extractPath = (url: string) => {
        const match = url.match(/\/storage\/v1\/object\/public\/assignments\/(.*)/);
        return match?.[1] ?? null;
      };

      const mainPath = extractPath(assignment.image_url);
      const thumbPath = extractPath(assignment.thumbnail_url);

      // Delete storage files
      const pathsToDelete = [mainPath, thumbPath].filter(
        (p): p is string => p !== null
      );
      if (pathsToDelete.length > 0) {
        await supabase.storage.from("assignments").remove(pathsToDelete);
      }

      // Delete assignment record
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignment.id);

      if (error) throw error;

      onClose();
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!assignment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>과제 삭제</DialogTitle>
          <DialogDescription>
            이 과제를 삭제하시겠습니까? 이미지와 함께 영구적으로 삭제됩니다.
          </DialogDescription>
        </DialogHeader>

        {assignment && (
          <img
            src={assignment.thumbnail_url}
            alt="삭제할 이미지"
            className="h-24 w-full rounded-lg object-cover"
          />
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : (
              "삭제"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

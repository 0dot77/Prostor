"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssignmentWithUser } from "@/lib/types";

interface ImageLightboxProps {
  assignment: AssignmentWithUser | null;
  assignments: AssignmentWithUser[];
  onClose: () => void;
  onNavigate: (assignment: AssignmentWithUser) => void;
}

export function ImageLightbox({
  assignment,
  assignments,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const currentIndex = assignment
    ? assignments.findIndex((a) => a.id === assignment.id)
    : -1;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < assignments.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) onNavigate(assignments[currentIndex - 1]);
  }, [hasPrev, currentIndex, assignments, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) onNavigate(assignments[currentIndex + 1]);
  }, [hasNext, currentIndex, assignments, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!assignment) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          handlePrev();
          break;
        case "ArrowRight":
          handleNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [assignment, onClose, handlePrev, handleNext]);

  const userName = assignment?.users?.name ?? "익명";

  return (
    <AnimatePresence>
      {assignment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Prev button */}
          {hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {/* Next button */}
          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {/* Image + Info */}
          <motion.div
            key={assignment.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={assignment.image_url}
              alt={assignment.title ?? "과제 이미지"}
              className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
            />

            {/* Caption */}
            <div className="mt-3 text-center text-white">
              {assignment.title && (
                <p className="text-base font-medium">{assignment.title}</p>
              )}
              <p className="mt-1 text-sm text-white/60">
                {userName} &middot;{" "}
                {new Date(assignment.created_at).toLocaleDateString("ko-KR")}
              </p>
              {assignment.description && (
                <p className="mt-1 max-w-lg text-sm text-white/50">
                  {assignment.description}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

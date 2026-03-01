"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlideViewer } from "@/components/slides/slide-viewer";
import { SlideResourcesBar } from "@/components/slides/slide-resources-bar";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2 } from "lucide-react";
import type { Slide } from "@/lib/types";

interface SlidePreviewPanelProps {
  slide: Slide | null;
  onClose: () => void;
}

export function SlidePreviewPanel({ slide, onClose }: SlidePreviewPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence>
      {slide && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed inset-x-0 bottom-0 z-50 border-t bg-background shadow-2xl ${
            expanded ? "top-0" : "top-1/3"
          } transition-all duration-300`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{slide.title}</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                프리뷰
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col h-[calc(100%-41px)]">
            <div className="flex-1 min-h-0">
              <SlideViewer slide={slide} />
            </div>
            <SlideResourcesBar slideId={slide.id} isAdmin={true} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

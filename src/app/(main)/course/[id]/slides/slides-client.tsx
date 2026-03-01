"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { PageResources } from "@/components/slides/page-resources";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import type { Week, Slide } from "@/lib/types";

// Dynamic import to avoid SSR issues with react-pdf
const PdfViewer = dynamic(
  () =>
    import("@/components/slides/pdf-viewer").then((mod) => ({
      default: mod.PdfViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">뷰어 로딩 중...</p>
      </div>
    ),
  }
);

interface SlidesClientProps {
  weeks: Week[];
  slides: Slide[];
  isAdmin: boolean;
}

export function SlidesClient({ weeks, slides, isAdmin }: SlidesClientProps) {
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    slides[0]?.id ?? null
  );
  const [currentPage, setCurrentPage] = useState(1);

  const selectedSlide = slides.find((s) => s.id === selectedSlideId) ?? null;

  // Group slides by week
  const slidesByWeek = weeks
    .map((week) => ({
      week,
      slides: slides.filter((s) => s.week_id === week.id),
    }))
    .filter((g) => g.slides.length > 0);

  if (slides.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            아직 등록된 슬라이드가 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Slide Selector (left panel) */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-56 shrink-0 overflow-y-auto border-r bg-background p-3"
      >
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          슬라이드 목록
        </h2>
        <div className="flex flex-col gap-3">
          {slidesByWeek.map(({ week, slides: weekSlides }) => (
            <div key={week.id}>
              <p className="mb-1 text-xs font-medium text-muted-foreground/60">
                {week.week_number}주차
              </p>
              <div className="flex flex-col gap-1">
                {weekSlides.map((slide) => (
                  <button
                    key={slide.id}
                    onClick={() => {
                      setSelectedSlideId(slide.id);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                      selectedSlideId === slide.id
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{slide.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* PDF Viewer (center) */}
      <div className="flex-1 min-w-0">
        {selectedSlide ? (
          <PdfViewer
            key={selectedSlide.id}
            fileUrl={selectedSlide.file_url}
            onPageChange={setCurrentPage}
            onLoadSuccess={(numPages) => {
              // Optionally update slide page_count if not set
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              좌측에서 슬라이드를 선택하세요.
            </p>
          </div>
        )}
      </div>

      {/* Page Resources (right panel) */}
      {selectedSlide && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 shrink-0 overflow-y-auto border-l bg-background p-3"
        >
          <PageResources
            key={`${selectedSlide.id}-${currentPage}`}
            slideId={selectedSlide.id}
            pageNumber={currentPage}
            isAdmin={isAdmin}
          />
        </motion.div>
      )}
    </div>
  );
}

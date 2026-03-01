"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadDialog } from "@/components/gallery/upload-dialog";
import { MasonryGrid } from "@/components/gallery/masonry-grid";
import { WeekFilterTabs } from "@/components/shared/week-filter-tabs";
import type { Week, AssignmentWithUser } from "@/lib/types";

interface AssignmentsClientProps {
  courseId: string;
  weeks: Week[];
  assignments: AssignmentWithUser[];
  currentUserId: string;
  isAdmin: boolean;
}

export function AssignmentsClient({
  courseId,
  weeks,
  assignments,
  currentUserId,
  isAdmin,
}: AssignmentsClientProps) {
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);

  const filteredAssignments = selectedWeekId
    ? assignments.filter((a) => a.week_id === selectedWeekId)
    : assignments;

  const countByWeek = (weekId: string) =>
    assignments.filter((a) => a.week_id === weekId).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between border-b px-6 py-4"
      >
        <div>
          <h1 className="text-lg font-semibold">과제 갤러리</h1>
          <p className="text-sm text-muted-foreground">
            {filteredAssignments.length}개의 과제
          </p>
        </div>
        {weeks.length > 0 && (
          <UploadDialog weeks={weeks} courseId={courseId} />
        )}
      </motion.div>

      {/* Week Filter Tabs */}
      {weeks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <WeekFilterTabs
            weeks={weeks}
            selectedWeekId={selectedWeekId}
            onSelect={setSelectedWeekId}
            totalCount={assignments.length}
            countByWeek={countByWeek}
          />
        </motion.div>
      )}

      {/* Gallery */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 overflow-y-auto p-6"
      >
        {weeks.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">
              아직 등록된 주차가 없습니다. 관리자에게 문의하세요.
            </p>
          </div>
        ) : (
          <MasonryGrid
            assignments={filteredAssignments}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        )}
      </motion.div>
    </div>
  );
}

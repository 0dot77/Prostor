"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { AddLinkDialog } from "@/components/resources/add-link-dialog";
import { LinkCard } from "@/components/resources/link-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LinkIcon } from "lucide-react";
import type { Week, Resource } from "@/lib/types";

interface ResourcesClientProps {
  courseId: string;
  weeks: Week[];
  resources: Resource[];
  isAdmin: boolean;
}

export function ResourcesClient({
  courseId,
  weeks,
  resources,
  isAdmin,
}: ResourcesClientProps) {
  const router = useRouter();
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filter: null = all, "none" = unassigned, weekId = specific week
  const filteredResources =
    selectedWeekId === null
      ? resources
      : selectedWeekId === "none"
        ? resources.filter((r) => !r.week_id)
        : resources.filter((r) => r.week_id === selectedWeekId);

  const countByWeek = (weekId: string | null) =>
    weekId === null
      ? resources.length
      : weekId === "none"
        ? resources.filter((r) => !r.week_id).length
        : resources.filter((r) => r.week_id === weekId).length;

  const handleDelete = async (resourceId: string) => {
    setDeleting(resourceId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resourceId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Delete resource error:", error);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between border-b px-6 py-4"
      >
        <div>
          <h1 className="text-lg font-semibold">수업 자료</h1>
          <p className="text-sm text-muted-foreground">
            {filteredResources.length}개의 자료
          </p>
        </div>
        {isAdmin && <AddLinkDialog courseId={courseId} weeks={weeks} />}
      </motion.div>

      {/* Week Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto border-b px-6 py-3"
      >
        <button
          onClick={() => setSelectedWeekId(null)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors whitespace-nowrap",
            selectedWeekId === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          전체
          <Badge
            variant="secondary"
            className={cn(
              "h-5 min-w-5 justify-center px-1.5 text-[10px]",
              selectedWeekId === null &&
                "bg-primary-foreground/20 text-primary-foreground"
            )}
          >
            {countByWeek(null)}
          </Badge>
        </button>

        {/* Unassigned */}
        {countByWeek("none") > 0 && (
          <button
            onClick={() => setSelectedWeekId("none")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors whitespace-nowrap",
              selectedWeekId === "none"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            일반
            <Badge
              variant="secondary"
              className={cn(
                "h-5 min-w-5 justify-center px-1.5 text-[10px]",
                selectedWeekId === "none" &&
                  "bg-primary-foreground/20 text-primary-foreground"
              )}
            >
              {countByWeek("none")}
            </Badge>
          </button>
        )}

        {weeks.map((week) => {
          const count = countByWeek(week.id);
          return (
            <button
              key={week.id}
              onClick={() => setSelectedWeekId(week.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors whitespace-nowrap",
                selectedWeekId === week.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {week.week_number}주차
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 min-w-5 justify-center px-1.5 text-[10px]",
                    selectedWeekId === week.id &&
                      "bg-primary-foreground/20 text-primary-foreground"
                  )}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Resources Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 overflow-y-auto p-6"
      >
        {filteredResources.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <LinkIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                {resources.length === 0
                  ? "아직 등록된 자료가 없습니다."
                  : "이 분류에 등록된 자료가 없습니다."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <LinkCard
                key={resource.id}
                resource={resource}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                deleting={deleting === resource.id}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

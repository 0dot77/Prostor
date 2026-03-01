"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Week } from "@/lib/types";

interface WeekTab {
  id: string | null;
  label: string;
  count: number;
  /** Only show this tab if count > 0 */
  hideIfEmpty?: boolean;
}

interface WeekFilterTabsProps {
  weeks: Week[];
  selectedWeekId: string | null;
  onSelect: (weekId: string | null) => void;
  /** Total count for "all" tab */
  totalCount: number;
  /** Count function per week */
  countByWeek: (weekId: string) => number;
  /** Optional extra tabs (e.g. "unassigned") inserted between "all" and week tabs */
  extraTabs?: WeekTab[];
}

export function WeekFilterTabs({
  weeks,
  selectedWeekId,
  onSelect,
  totalCount,
  countByWeek,
  extraTabs = [],
}: WeekFilterTabsProps) {
  const renderTab = (tab: WeekTab) => {
    if (tab.hideIfEmpty && tab.count === 0) return null;

    const isActive = selectedWeekId === tab.id;

    return (
      <button
        key={tab.id ?? "all"}
        onClick={() => onSelect(tab.id)}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors whitespace-nowrap",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-accent"
        )}
      >
        {tab.label}
        {(tab.count > 0 || tab.id === null) && (
          <Badge
            variant="secondary"
            className={cn(
              "h-5 min-w-5 justify-center px-1.5 text-[10px]",
              isActive && "bg-primary-foreground/20 text-primary-foreground"
            )}
          >
            {tab.count}
          </Badge>
        )}
      </button>
    );
  };

  const allTab: WeekTab = { id: null, label: "전체", count: totalCount };

  const weekTabs: WeekTab[] = weeks.map((week) => ({
    id: week.id,
    label: `${week.week_number}주차`,
    count: countByWeek(week.id),
  }));

  return (
    <div className="flex gap-2 overflow-x-auto border-b px-6 py-3">
      {renderTab(allTab)}
      {extraTabs.map(renderTab)}
      {weekTabs.map(renderTab)}
    </div>
  );
}

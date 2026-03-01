"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PenTool,
  FileText,
  Image,
  LinkIcon,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getDisplayName, getInitials } from "@/lib/user-utils";
import type { User, Course } from "@/lib/types";

const courseLinks = [
  { segment: "whiteboard", label: "화이트보드", icon: PenTool },
  { segment: "slides", label: "슬라이드", icon: FileText },
  { segment: "assignments", label: "과제", icon: Image },
  { segment: "resources", label: "자료", icon: LinkIcon },
];

interface CourseSidebarProps {
  course: Course;
  user: User;
}

export function CourseSidebar({ course, user }: CourseSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-200",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Course Title */}
      {!collapsed && (
        <div className="px-4 pb-2">
          <h2 className="truncate text-sm font-semibold">{course.title}</h2>
        </div>
      )}

      <Separator className="my-1" />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
        {courseLinks.map((link) => {
          const href = `/course/${course.id}/${link.segment}`;
          const isActive = pathname.includes(link.segment);
          return (
            <Link
              key={link.segment}
              href={href}
              title={collapsed ? link.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <Separator />
      <div className={cn("flex items-center gap-3 p-3", collapsed && "justify-center")}>
        <Avatar className="h-7 w-7">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <span className="truncate text-sm text-muted-foreground">
            {displayName}
          </span>
        )}
      </div>
    </aside>
  );
}

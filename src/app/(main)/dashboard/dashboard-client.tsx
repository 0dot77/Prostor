"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLogout } from "@/hooks/use-logout";
import { getDisplayName, getInitials } from "@/lib/user-utils";
import type { User, Course } from "@/lib/types";

interface DashboardClientProps {
  user: User;
  courses: Course[];
}

export function DashboardClient({ user, courses }: DashboardClientProps) {
  const router = useRouter();
  const handleLogout = useLogout();

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  return (
    <div className="flex min-h-screen flex-col justify-between px-8 py-12 md:px-16 lg:px-24">
      {/* Header: Avatar + Settings */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url ?? undefined} alt={displayName} />
            <AvatarFallback className="text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/courses")}
              title="Admin"
            >
              <Shield className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      {/* Main: Greeting + Course List */}
      <div className="flex flex-1 flex-col justify-center">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <p className="text-lg text-muted-foreground">안녕하세요,</p>
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            {displayName}님.
          </h1>
        </motion.div>

        {/* Course List - Game Menu Style */}
        <div className="flex flex-col gap-1">
          {courses.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground"
            >
              등록된 강의가 없습니다.
            </motion.p>
          ) : (
            courses.map((course, index) => (
              <motion.button
                key={course.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
                onClick={() => router.push(`/course/${course.id}/whiteboard`)}
                className="group flex items-center gap-4 rounded-lg px-4 py-5 text-left transition-all hover:bg-accent"
              >
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-semibold tracking-tight transition-colors group-hover:text-foreground md:text-2xl">
                    {course.title}
                  </span>
                  {course.description && (
                    <span className="text-sm text-muted-foreground">
                      {course.description}
                    </span>
                  )}
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="pt-8 text-center"
      >
        <p className="text-xs text-muted-foreground/50">Prostor</p>
      </motion.div>
    </div>
  );
}

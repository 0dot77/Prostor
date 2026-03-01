"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { AssignmentWithUser } from "@/lib/types";

interface AssignmentCardProps {
  assignment: AssignmentWithUser;
  currentUserId: string;
  isAdmin: boolean;
  onImageClick: (assignment: AssignmentWithUser) => void;
  onEdit: (assignment: AssignmentWithUser) => void;
  onDelete: (assignment: AssignmentWithUser) => void;
}

export function AssignmentCard({
  assignment,
  currentUserId,
  isAdmin,
  onImageClick,
  onEdit,
  onDelete,
}: AssignmentCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(
    assignment.thumbnail_url || assignment.image_url
  );
  const canModify = isAdmin || assignment.user_id === currentUserId;

  const userName =
    assignment.users?.name ?? assignment.users?.avatar_url ?? "익명";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const date = new Date(assignment.created_at).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group relative overflow-hidden rounded-lg border bg-card"
    >
      {/* Image */}
      <div
        className="relative cursor-pointer overflow-hidden"
        onClick={() => onImageClick(assignment)}
      >
        {!loaded && (
          <div className="aspect-square w-full animate-pulse bg-muted" />
        )}
        <img
          src={imgSrc}
          alt={assignment.title ?? "과제 이미지"}
          className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
          style={loaded ? undefined : { position: "absolute", opacity: 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (imgSrc !== assignment.image_url) {
              setImgSrc(assignment.image_url);
            }
          }}
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3">
        {assignment.title && (
          <p className="text-sm font-medium leading-tight line-clamp-2">
            {assignment.title}
          </p>
        )}
        {assignment.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {assignment.description}
          </p>
        )}

        {/* Author & Actions */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={assignment.users?.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{userName}</span>
            <span className="text-xs text-muted-foreground/50">{date}</span>
          </div>

          {canModify && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(assignment)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  수정
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(assignment)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.div>
  );
}

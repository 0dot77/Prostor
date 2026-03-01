"use client";

import { useState } from "react";
import Masonry from "react-masonry-css";
import { AnimatePresence } from "framer-motion";
import { AssignmentCard } from "./assignment-card";
import { ImageLightbox } from "./image-lightbox";
import { EditAssignmentDialog } from "./edit-assignment-dialog";
import { DeleteAssignmentDialog } from "./delete-assignment-dialog";
import type { AssignmentWithUser } from "@/lib/types";

interface MasonryGridProps {
  assignments: AssignmentWithUser[];
  currentUserId: string;
  isAdmin: boolean;
}

const breakpointColumns = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1,
};

export function MasonryGrid({
  assignments,
  currentUserId,
  isAdmin,
}: MasonryGridProps) {
  const [lightboxItem, setLightboxItem] =
    useState<AssignmentWithUser | null>(null);
  const [editItem, setEditItem] = useState<AssignmentWithUser | null>(null);
  const [deleteItem, setDeleteItem] = useState<AssignmentWithUser | null>(null);

  if (assignments.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">
          아직 제출된 과제가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex w-auto gap-4"
        columnClassName="flex flex-col gap-4"
      >
        <AnimatePresence mode="popLayout">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onImageClick={setLightboxItem}
              onEdit={setEditItem}
              onDelete={setDeleteItem}
            />
          ))}
        </AnimatePresence>
      </Masonry>

      {/* Lightbox */}
      <ImageLightbox
        assignment={lightboxItem}
        assignments={assignments}
        onClose={() => setLightboxItem(null)}
        onNavigate={setLightboxItem}
      />

      {/* Edit Dialog */}
      <EditAssignmentDialog
        assignment={editItem}
        onClose={() => setEditItem(null)}
      />

      {/* Delete Dialog */}
      <DeleteAssignmentDialog
        assignment={deleteItem}
        onClose={() => setDeleteItem(null)}
      />
    </>
  );
}

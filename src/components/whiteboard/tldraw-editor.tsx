"use client";

import { Tldraw } from "tldraw";
import { useSyncDemo } from "@tldraw/sync";
import "tldraw/tldraw.css";

interface TldrawEditorProps {
  roomId: string;
}

export function TldrawEditor({ roomId }: TldrawEditorProps) {
  const store = useSyncDemo({ roomId });

  return (
    <div className="h-full w-full">
      <Tldraw store={store} />
    </div>
  );
}

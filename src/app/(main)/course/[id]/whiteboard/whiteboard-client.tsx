"use client";

import dynamic from "next/dynamic";

const TldrawEditor = dynamic(
  () =>
    import("@/components/whiteboard/tldraw-editor").then((mod) => ({
      default: mod.TldrawEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">화이트보드 로딩 중...</p>
      </div>
    ),
  }
);

interface WhiteboardClientProps {
  roomId: string;
}

export function WhiteboardClient({ roomId }: WhiteboardClientProps) {
  return (
    <div className="h-full w-full">
      <TldrawEditor roomId={roomId} />
    </div>
  );
}

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
  userId: string;
  userName: string;
  userAvatar?: string;
}

export function WhiteboardClient({ roomId, userId, userName, userAvatar }: WhiteboardClientProps) {
  return (
    <div className="h-full w-full">
      <TldrawEditor roomId={roomId} userId={userId} userName={userName} userAvatar={userAvatar} />
    </div>
  );
}

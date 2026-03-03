"use client";

import { useEffect } from "react";
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
  // Prevent browser-level page zoom while on the whiteboard.
  // tldraw handles its own zoom internally; without this, once tldraw hits its
  // zoom limit the gesture leaks to the browser and scales the entire page.
  useEffect(() => {
    // Set viewport meta to block user-scalable zoom on mobile/tablet
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const prevContent = meta?.content ?? "";
    if (meta) {
      meta.content =
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
    }

    // Block Ctrl/Cmd + wheel (desktop trackpad pinch in Chrome/Firefox)
    // Note: tldraw calls stopPropagation() on wheel events it handles,
    // so this only catches events tldraw doesn't process (e.g. when unfocused).
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    document.addEventListener("wheel", handleWheel, { passive: false });

    // Block Safari gesture-based pinch zoom (gesturestart/gesturechange)
    // Safari uses native gesture events instead of Ctrl+wheel for trackpad pinch.
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener("gesturestart", handleGesture);
    document.addEventListener("gesturechange", handleGesture);

    return () => {
      if (meta) meta.content = prevContent;
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("gesturestart", handleGesture);
      document.removeEventListener("gesturechange", handleGesture);
    };
  }, []);

  // Use absolute positioning instead of h-full/w-full to avoid CSS height
  // chain resolution issues during zoom-triggered re-layout. The parent
  // <main> has position:relative and overflow:hidden, so inset-0 fills it
  // reliably regardless of flex recalculation.
  return (
    <div className="absolute inset-0" style={{ touchAction: "none" }}>
      <TldrawEditor roomId={roomId} userId={userId} userName={userName} userAvatar={userAvatar} />
    </div>
  );
}

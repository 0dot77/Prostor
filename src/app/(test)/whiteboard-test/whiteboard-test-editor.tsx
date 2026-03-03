"use client";

import { useCallback, useMemo } from "react";
import { Tldraw, type Editor, type TLComponents } from "tldraw";
import { useSyncDemo } from "@tldraw/sync";
import "tldraw/tldraw.css";

const components: TLComponents = {
  PageMenu: null,
};

/**
 * tldraw editor with useSyncDemo — matches the real whiteboard setup.
 * Used by E2E tests to verify zoom behavior with sync connection.
 */
export function WhiteboardTestEditor() {
  const userInfo = useMemo(
    () => ({
      id: "e2e-user",
      name: "E2E Tester",
      color: "#3b82f6",
    }),
    []
  );

  const storeWithStatus = useSyncDemo({
    roomId: "e2e-test-room-zoom",
    userInfo,
  });

  const handleMount = useCallback((editor: Editor) => {
    editor.setCameraOptions({
      zoomSteps: [0.25, 0.5, 1, 2, 4],
    });
  }, []);

  // Match the real TldrawEditor: extract store via ref approach
  if (storeWithStatus.status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">화이트보드 연결 중...</p>
      </div>
    );
  }

  if (storeWithStatus.status === "error") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-destructive">연결 실패</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <Tldraw
        store={storeWithStatus}
        onMount={handleMount}
        components={components}
      />
    </div>
  );
}

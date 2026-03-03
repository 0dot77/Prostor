"use client";

import dynamic from "next/dynamic";

/**
 * Standalone test page for the whiteboard — no auth or sync server required.
 * Uses a local tldraw store so E2E tests can run without external dependencies.
 *
 * Access at: /whiteboard-test
 */

const WhiteboardTestEditor = dynamic(
  () => import("./whiteboard-test-editor").then((m) => ({ default: m.WhiteboardTestEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    ),
  }
);

export default function WhiteboardTestPage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0" style={{ touchAction: "none" }}>
        <WhiteboardTestEditor />
      </div>
    </div>
  );
}

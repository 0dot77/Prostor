"use client";

import { Component, useCallback, useEffect, useMemo, useRef } from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  Tldraw,
  type Editor,
  type TLComponents,
  useEditor,
  useValue,
} from "tldraw";
import { useSyncDemo } from "@tldraw/sync";
import "tldraw/tldraw.css";

import { stringToColor } from "@/lib/whiteboard-utils";

/**
 * Error Boundary that catches runtime errors inside tldraw.
 * Without this, an uncaught error unmounts the entire whiteboard panel.
 */
class TldrawErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[TldrawErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm text-destructive">
              화이트보드에서 오류가 발생했습니다.
            </p>
            <p className="text-xs text-muted-foreground">
              {this.state.error?.message}
            </p>
            <button
              className="text-xs underline text-muted-foreground hover:text-foreground"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Overlay component that shows author name on note shapes.
 * Wrapped in try/catch to prevent tldraw signal system crashes.
 */
function NoteAuthorOverlay() {
  const editor = useEditor();

  const labels = useValue(
    "noteLabels",
    () => {
      try {
        const zoom = editor.getZoomLevel();
        // Skip overlay rendering at extreme zoom levels to avoid
        // computation issues with viewport coordinate conversion
        if (zoom < 0.3) return [];

        return editor
          .getCurrentPageShapes()
          .filter(
            (s) =>
              s.type === "note" &&
              (s.meta as Record<string, unknown>)?.authorName
          )
          .map((shape) => {
            const bounds = editor.getShapePageBounds(shape.id);
            if (!bounds) return null;

            const meta = shape.meta as Record<string, unknown>;
            const screenPoint = editor.pageToViewport({
              x: bounds.x,
              y: bounds.maxY,
            });

            return {
              id: shape.id,
              authorName: meta.authorName as string,
              authorColor: (meta.authorColor as string) ?? "#888",
              left: screenPoint.x,
              top: screenPoint.y + 4 * zoom,
              fontSize: Math.max(10, 11 * zoom),
              paddingV: 1 * zoom,
              paddingH: 4 * zoom,
              borderRadius: 3 * zoom,
            };
          })
          .filter(
            (l): l is NonNullable<typeof l> => l !== null
          );
      } catch {
        return [];
      }
    },
    [editor]
  );

  if (labels.length === 0) return null;

  return (
    <>
      {labels.map((label) => (
        <div
          key={label.id}
          style={{
            position: "absolute",
            left: label.left,
            top: label.top,
            pointerEvents: "none",
            zIndex: 999,
          }}
        >
          <span
            style={{
              fontSize: label.fontSize,
              color: label.authorColor,
              fontWeight: 500,
              backgroundColor: "rgba(255,255,255,0.85)",
              padding: `${label.paddingV}px ${label.paddingH}px`,
              borderRadius: label.borderRadius,
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            {label.authorName}
          </span>
        </div>
      ))}
    </>
  );
}

function OnTheCanvas() {
  return <NoteAuthorOverlay />;
}

const components: TLComponents = {
  InFrontOfTheCanvas: OnTheCanvas,
  PageMenu: null,
};

interface TldrawEditorProps {
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export function TldrawEditor({
  roomId,
  userId,
  userName,
  userAvatar,
}: TldrawEditorProps) {
  // Memoize userInfo to prevent useSyncDemo from recreating the WebSocket
  // connection. Without this, each render creates a new object reference,
  // which cascades through tldraw's internal hooks and tears down the
  // connection, causing whiteboard content to disappear.
  const userInfo = useMemo(
    () => ({
      id: userId,
      name: userName,
      color: stringToColor(userName),
    }),
    [userId, userName]
  );

  const storeWithStatus = useSyncDemo({ roomId, userInfo });

  const handleMount = useCallback(
    (editor: Editor) => {
      // Inject author metadata into newly created note shapes
      editor.sideEffects.registerBeforeCreateHandler("shape", (shape) => {
        if (shape.type === "note") {
          return {
            ...shape,
            meta: {
              ...shape.meta,
              authorName: userName,
              authorColor: stringToColor(userName),
            },
          };
        }
        return shape;
      });
    },
    [userName]
  );

  // Let tldraw handle all status transitions (loading/error/synced) internally.
  // Passing TLStoreWithStatus directly is the intended API — tldraw shows its
  // own loading spinner and manages store lifecycle correctly.
  return (
    <div className="absolute inset-0">
      <TldrawErrorBoundary>
        <Tldraw
          store={storeWithStatus}
          onMount={handleMount}
          components={components}
        />
      </TldrawErrorBoundary>
    </div>
  );
}

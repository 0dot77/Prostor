"use client";

import { useCallback } from "react";
import {
  Tldraw,
  type Editor,
  type TLShape,
  type TLShapeId,
  type TLComponents,
  DefaultShapeIndicator,
  useEditor,
  useValue,
} from "tldraw";
import { useSyncDemo } from "@tldraw/sync";
import "tldraw/tldraw.css";

import { stringToColor } from "@/lib/whiteboard-utils";

interface NoteLabel {
  id: TLShapeId;
  authorName: string;
  authorColor: string;
  left: number;
  top: number;
  fontSize: number;
  paddingV: number;
  paddingH: number;
  borderRadius: number;
}

/**
 * Overlay component that shows author name on note shapes.
 * All reactive reads (shapes, camera, zoom) happen inside useValue
 * so the overlay re-renders on pan/zoom/shape changes.
 */
function NoteAuthorOverlay() {
  const editor = useEditor();

  const labels = useValue<NoteLabel[]>(
    "noteLabels",
    () => {
      // Reading camera & zoom inside useValue makes this reactive to pan/zoom
      const _camera = editor.getCamera();
      const zoom = editor.getZoomLevel();

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
        .filter((l) => l !== null) as NoteLabel[];
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

/**
 * Custom component placed in tldraw's OnTheCanvas slot
 * to render author labels on note shapes.
 */
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
  const store = useSyncDemo({
    roomId,
    userInfo: {
      id: userId,
      name: userName,
      color: stringToColor(userName),
    },
  });

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

  return (
    <div className="h-full w-full">
      <Tldraw store={store} onMount={handleMount} components={components} />
    </div>
  );
}

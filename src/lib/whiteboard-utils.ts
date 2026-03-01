/**
 * Whiteboard utility functions extracted for testability.
 * These are used by tldraw-editor.tsx but can be tested independently.
 */

/**
 * Generate a consistent color from a string (user name → avatar color).
 */
export function stringToColor(str: string): string {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F0B27A", "#82E0AA",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Inject author metadata into a note shape.
 * Returns the modified shape with authorName/authorColor in meta.
 */
export function injectAuthorMeta<
  T extends { type: string; meta: Record<string, unknown> },
>(shape: T, userName: string): T {
  if (shape.type !== "note") return shape;

  return {
    ...shape,
    meta: {
      ...shape.meta,
      authorName: userName,
      authorColor: stringToColor(userName),
    },
  };
}

/**
 * Extract author info from a shape's meta.
 */
export function getAuthorFromShape(shape: {
  meta: Record<string, unknown>;
}): { name: string; color: string } | null {
  const name = shape.meta?.authorName;
  const color = shape.meta?.authorColor;
  if (typeof name !== "string") return null;
  return { name, color: typeof color === "string" ? color : "#888" };
}

/**
 * Simulate concurrent note creation by N users.
 * Returns an array of shapes with injected author metadata.
 */
export function simulateConcurrentNotes(
  users: { name: string }[],
  notesPerUser: number = 3
): Array<{
  id: string;
  type: string;
  meta: Record<string, unknown>;
  x: number;
  y: number;
}> {
  const shapes: Array<{
    id: string;
    type: string;
    meta: Record<string, unknown>;
    x: number;
    y: number;
  }> = [];

  for (const user of users) {
    for (let i = 0; i < notesPerUser; i++) {
      const baseShape = {
        id: `shape:${user.name}-${i}`,
        type: "note" as const,
        meta: {} as Record<string, unknown>,
        x: Math.random() * 1000,
        y: Math.random() * 1000,
      };

      shapes.push(injectAuthorMeta(baseShape, user.name));
    }
  }

  return shapes;
}

/**
 * Check if there are any metadata collisions
 * (two different users' notes with the same authorName).
 */
export function detectAuthorCollisions(
  shapes: Array<{ meta: Record<string, unknown> }>
): { hasCollision: boolean; details: string[] } {
  const notesByAuthor = new Map<string, Set<string>>();
  const details: string[] = [];

  for (const shape of shapes) {
    const author = getAuthorFromShape(shape);
    if (!author) continue;

    if (!notesByAuthor.has(author.name)) {
      notesByAuthor.set(author.name, new Set());
    }
    notesByAuthor.get(author.name)!.add(author.color);
  }

  // Check if same author name maps to different colors (shouldn't happen)
  for (const [name, colors] of notesByAuthor) {
    if (colors.size > 1) {
      details.push(
        `Author "${name}" has ${colors.size} different colors: ${[...colors].join(", ")}`
      );
    }
  }

  return { hasCollision: details.length > 0, details };
}

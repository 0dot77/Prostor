import { describe, it, expect } from "vitest";
import {
  stringToColor,
  injectAuthorMeta,
  getAuthorFromShape,
  simulateConcurrentNotes,
  detectAuthorCollisions,
} from "./whiteboard-utils";

// ─── stringToColor ──────────────────────────────────────────

describe("stringToColor", () => {
  it("returns a valid hex color", () => {
    const color = stringToColor("Taeyang Yoo");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("is deterministic", () => {
    expect(stringToColor("Alice")).toBe(stringToColor("Alice"));
  });

  it("different names produce (likely) different colors", () => {
    const colors = new Set(
      ["Alice", "Bob", "Charlie", "Diana", "Eve"].map(stringToColor)
    );
    // With 12 available colors and 5 inputs, expect at least 3 unique
    expect(colors.size).toBeGreaterThanOrEqual(3);
  });

  it("handles empty string", () => {
    const color = stringToColor("");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("handles unicode characters", () => {
    const color = stringToColor("유태양");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

// ─── injectAuthorMeta ───────────────────────────────────────

describe("injectAuthorMeta", () => {
  it("adds authorName and authorColor to note shapes", () => {
    const shape = {
      type: "note" as const,
      meta: {} as Record<string, unknown>,
    };
    const result = injectAuthorMeta(shape, "Alice");

    expect(result.meta.authorName).toBe("Alice");
    expect(result.meta.authorColor).toBe(stringToColor("Alice"));
  });

  it("preserves existing meta properties", () => {
    const shape = {
      type: "note" as const,
      meta: { existingProp: "keep" } as Record<string, unknown>,
    };
    const result = injectAuthorMeta(shape, "Bob");

    expect(result.meta.existingProp).toBe("keep");
    expect(result.meta.authorName).toBe("Bob");
  });

  it("does NOT modify non-note shapes", () => {
    const shape = {
      type: "rectangle" as const,
      meta: {} as Record<string, unknown>,
    };
    const result = injectAuthorMeta(shape, "Charlie");

    expect(result.meta.authorName).toBeUndefined();
  });

  it("does not mutate the original shape", () => {
    const shape = {
      type: "note" as const,
      meta: {} as Record<string, unknown>,
    };
    const result = injectAuthorMeta(shape, "Diana");

    expect(shape.meta.authorName).toBeUndefined();
    expect(result.meta.authorName).toBe("Diana");
  });
});

// ─── getAuthorFromShape ─────────────────────────────────────

describe("getAuthorFromShape", () => {
  it("extracts author info from shape meta", () => {
    const shape = {
      meta: { authorName: "Alice", authorColor: "#FF6B6B" } as Record<
        string,
        unknown
      >,
    };
    const author = getAuthorFromShape(shape);
    expect(author).toEqual({ name: "Alice", color: "#FF6B6B" });
  });

  it("returns null if no authorName", () => {
    const shape = { meta: {} as Record<string, unknown> };
    expect(getAuthorFromShape(shape)).toBeNull();
  });

  it("defaults color to #888 if missing", () => {
    const shape = {
      meta: { authorName: "Bob" } as Record<string, unknown>,
    };
    const author = getAuthorFromShape(shape);
    expect(author).toEqual({ name: "Bob", color: "#888" });
  });
});

// ─── 20-user concurrent simulation ─────────────────────────

describe("20-user concurrent whiteboard simulation", () => {
  const users = Array.from({ length: 20 }, (_, i) => ({
    name: `Student_${i + 1}`,
  }));

  it("creates correct number of notes (20 users × 3 each = 60)", () => {
    const shapes = simulateConcurrentNotes(users, 3);
    expect(shapes).toHaveLength(60);
  });

  it("every note has author metadata", () => {
    const shapes = simulateConcurrentNotes(users, 3);

    for (const shape of shapes) {
      expect(shape.meta.authorName).toBeDefined();
      expect(shape.meta.authorColor).toBeDefined();
      expect(typeof shape.meta.authorName).toBe("string");
      expect(typeof shape.meta.authorColor).toBe("string");
    }
  });

  it("each user's notes have consistent color", () => {
    const shapes = simulateConcurrentNotes(users, 5);
    const { hasCollision, details } = detectAuthorCollisions(shapes);

    expect(hasCollision).toBe(false);
    if (details.length > 0) {
      throw new Error(`Collisions found: ${details.join("; ")}`);
    }
  });

  it("author names are correctly assigned (no cross-contamination)", () => {
    const shapes = simulateConcurrentNotes(users, 3);

    // Group by expected author (from shape id)
    for (const shape of shapes) {
      const expectedAuthor = shape.id.split(":")[1].split("-")[0];
      expect(shape.meta.authorName).toBe(expectedAuthor);
    }
  });

  it("handles 20 users × 10 notes each (200 notes) without issues", () => {
    const startTime = performance.now();
    const shapes = simulateConcurrentNotes(users, 10);
    const elapsed = performance.now() - startTime;

    expect(shapes).toHaveLength(200);
    // Should complete in under 100ms
    expect(elapsed).toBeLessThan(100);
  });

  it("handles 20 users × 50 notes each (1000 notes) performantly", () => {
    const startTime = performance.now();
    const shapes = simulateConcurrentNotes(users, 50);
    const elapsed = performance.now() - startTime;

    expect(shapes).toHaveLength(1000);
    // 1000 shape creations should complete in under 500ms
    expect(elapsed).toBeLessThan(500);

    // Verify all metadata is intact
    const { hasCollision } = detectAuthorCollisions(shapes);
    expect(hasCollision).toBe(false);
  });

  it("unique shape IDs across all users", () => {
    const shapes = simulateConcurrentNotes(users, 5);
    const ids = shapes.map((s) => s.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it("non-note shapes are not affected by meta injection", () => {
    // Simulate mixed shapes
    const rectShape = {
      type: "rectangle" as const,
      meta: {} as Record<string, unknown>,
    };
    const arrowShape = {
      type: "arrow" as const,
      meta: {} as Record<string, unknown>,
    };

    const resultRect = injectAuthorMeta(rectShape, "Student_1");
    const resultArrow = injectAuthorMeta(arrowShape, "Student_2");

    expect(resultRect.meta.authorName).toBeUndefined();
    expect(resultArrow.meta.authorName).toBeUndefined();
  });

  it("color distribution is reasonable across 20 users", () => {
    const colors = users.map((u) => stringToColor(u.name));
    const uniqueColors = new Set(colors);

    // With 12 available colors and 20 users, expect at least 6 unique colors
    expect(uniqueColors.size).toBeGreaterThanOrEqual(6);
  });

  it("handles rapid sequential note creation (burst mode)", () => {
    const burstUser = { name: "BurstUser" };
    const startTime = performance.now();

    const shapes = [];
    for (let i = 0; i < 100; i++) {
      shapes.push(
        injectAuthorMeta(
          {
            type: "note" as const,
            meta: {} as Record<string, unknown>,
          },
          burstUser.name
        )
      );
    }

    const elapsed = performance.now() - startTime;

    // All should have same author
    expect(shapes.every((s) => s.meta.authorName === "BurstUser")).toBe(true);
    // All should have same color
    const firstColor = shapes[0].meta.authorColor;
    expect(shapes.every((s) => s.meta.authorColor === firstColor)).toBe(true);
    // Should be fast
    expect(elapsed).toBeLessThan(50);
  });
});

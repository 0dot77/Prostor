import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock next/dynamic to render the component directly
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default: React.ComponentType<any> }>) => {
    // Eagerly resolve for tests
    const MockTldrawEditor = (props: Record<string, unknown>) => (
      <div data-testid="tldraw-editor" data-room-id={props.roomId as string} />
    );
    return MockTldrawEditor;
  },
}));

import { WhiteboardClient } from "./whiteboard-client";

const defaultProps = {
  roomId: "test-room",
  userId: "user-1",
  userName: "테스트유저",
  userAvatar: undefined,
};

describe("WhiteboardClient", () => {
  let addedListeners: Array<{ type: string; handler: EventListener; options?: any }>;
  let removedListeners: Array<{ type: string; handler: EventListener }>;
  let originalAddEventListener: typeof document.addEventListener;
  let originalRemoveEventListener: typeof document.removeEventListener;

  beforeEach(() => {
    addedListeners = [];
    removedListeners = [];

    originalAddEventListener = document.addEventListener;
    originalRemoveEventListener = document.removeEventListener;

    document.addEventListener = vi.fn((type: string, handler: EventListener, options?: any) => {
      addedListeners.push({ type, handler, options });
      originalAddEventListener.call(document, type, handler, options);
    }) as any;

    document.removeEventListener = vi.fn((type: string, handler: EventListener) => {
      removedListeners.push({ type, handler });
      originalRemoveEventListener.call(document, type, handler);
    }) as any;
  });

  afterEach(() => {
    document.addEventListener = originalAddEventListener;
    document.removeEventListener = originalRemoveEventListener;
    cleanup();
  });

  describe("rendering", () => {
    it("renders the tldraw editor component", () => {
      render(<WhiteboardClient {...defaultProps} />);
      expect(screen.getByTestId("tldraw-editor")).toBeInTheDocument();
    });

    it("uses absolute positioning for layout stability", () => {
      const { container } = render(<WhiteboardClient {...defaultProps} />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.className).toContain("absolute");
      expect(wrapper.className).toContain("inset-0");
    });

    it("sets touch-action: none to prevent browser touch zoom", () => {
      const { container } = render(<WhiteboardClient {...defaultProps} />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.style.touchAction).toBe("none");
    });
  });

  describe("browser zoom prevention", () => {
    it("registers wheel event listener with passive: false", () => {
      render(<WhiteboardClient {...defaultProps} />);
      const wheelListener = addedListeners.find((l) => l.type === "wheel");
      expect(wheelListener).toBeDefined();
      expect(wheelListener!.options).toEqual({ passive: false });
    });

    it("registers gesturestart listener for Safari pinch zoom", () => {
      render(<WhiteboardClient {...defaultProps} />);
      const gestureStart = addedListeners.find((l) => l.type === "gesturestart");
      expect(gestureStart).toBeDefined();
    });

    it("registers gesturechange listener for Safari pinch zoom", () => {
      render(<WhiteboardClient {...defaultProps} />);
      const gestureChange = addedListeners.find((l) => l.type === "gesturechange");
      expect(gestureChange).toBeDefined();
    });

    it("prevents default on Ctrl+wheel events (Chrome/Firefox trackpad zoom)", () => {
      render(<WhiteboardClient {...defaultProps} />);
      const wheelListener = addedListeners.find((l) => l.type === "wheel");

      const event = new WheelEvent("wheel", { ctrlKey: true, cancelable: true });
      const preventSpy = vi.spyOn(event, "preventDefault");
      wheelListener!.handler(event);

      expect(preventSpy).toHaveBeenCalled();
    });

    it("prevents default on Meta+wheel events (macOS Cmd+scroll)", () => {
      render(<WhiteboardClient {...defaultProps} />);
      const wheelListener = addedListeners.find((l) => l.type === "wheel");

      const event = new WheelEvent("wheel", { metaKey: true, cancelable: true });
      const preventSpy = vi.spyOn(event, "preventDefault");
      wheelListener!.handler(event);

      expect(preventSpy).toHaveBeenCalled();
    });

    it("does NOT prevent default on regular wheel events (normal scroll)", () => {
      render(<WhiteboardClient {...defaultProps} />);
      const wheelListener = addedListeners.find((l) => l.type === "wheel");

      const event = new WheelEvent("wheel", { cancelable: true });
      const preventSpy = vi.spyOn(event, "preventDefault");
      wheelListener!.handler(event);

      expect(preventSpy).not.toHaveBeenCalled();
    });

    it("prevents default on gesture events (Safari pinch)", () => {
      render(<WhiteboardClient {...defaultProps} />);
      const gestureListener = addedListeners.find((l) => l.type === "gesturestart");

      const event = new Event("gesturestart", { cancelable: true });
      const preventSpy = vi.spyOn(event, "preventDefault");
      gestureListener!.handler(event);

      expect(preventSpy).toHaveBeenCalled();
    });
  });

  describe("cleanup on unmount", () => {
    it("removes all event listeners on unmount", () => {
      const { unmount } = render(<WhiteboardClient {...defaultProps} />);

      const wheelHandler = addedListeners.find((l) => l.type === "wheel")!.handler;
      const gestureStartHandler = addedListeners.find((l) => l.type === "gesturestart")!.handler;
      const gestureChangeHandler = addedListeners.find((l) => l.type === "gesturechange")!.handler;

      unmount();

      const removedTypes = removedListeners.map((l) => l.type);
      expect(removedTypes).toContain("wheel");
      expect(removedTypes).toContain("gesturestart");
      expect(removedTypes).toContain("gesturechange");

      // Verify the SAME handlers are removed (not different ones)
      expect(removedListeners.find((l) => l.type === "wheel")!.handler).toBe(wheelHandler);
      expect(removedListeners.find((l) => l.type === "gesturestart")!.handler).toBe(gestureStartHandler);
      expect(removedListeners.find((l) => l.type === "gesturechange")!.handler).toBe(gestureChangeHandler);
    });

    it("restores viewport meta tag on unmount", () => {
      // Set up a viewport meta tag
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1";
      document.head.appendChild(meta);

      const originalContent = meta.content;

      const { unmount } = render(<WhiteboardClient {...defaultProps} />);

      // During mount, meta should be modified
      expect(meta.content).toContain("maximum-scale=1");
      expect(meta.content).toContain("user-scalable=no");

      unmount();

      // After unmount, meta should be restored
      expect(meta.content).toBe(originalContent);

      // Clean up
      document.head.removeChild(meta);
    });
  });
});

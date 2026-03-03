import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

// Control useSyncDemo return value from tests
let mockStoreStatus: Record<string, unknown> = { status: "loading" };

vi.mock("@tldraw/sync", () => ({
  useSyncDemo: vi.fn(() => mockStoreStatus),
}));

// Track Tldraw render count and props
let tldrawRenderCount = 0;
let lastTldrawProps: Record<string, unknown> | null = null;

vi.mock("tldraw", () => ({
  Tldraw: vi.fn((props: Record<string, unknown>) => {
    tldrawRenderCount++;
    lastTldrawProps = props;
    return <div data-testid="tldraw-canvas" />;
  }),
  useEditor: vi.fn(),
  useValue: vi.fn(() => []),
}));

vi.mock("tldraw/tldraw.css", () => ({}));

// Import after mocks are registered
import { TldrawEditor } from "./tldraw-editor";
import { useSyncDemo } from "@tldraw/sync";

const defaultProps = {
  roomId: "test-room-123",
  userId: "user-1",
  userName: "테스트유저",
  userAvatar: undefined,
};

beforeEach(() => {
  tldrawRenderCount = 0;
  lastTldrawProps = null;
  mockStoreStatus = { status: "loading" };
  vi.clearAllMocks();
});

// --- Tests ---

describe("TldrawEditor", () => {
  describe("store lifecycle", () => {
    it("passes storeWithStatus directly to Tldraw (lets tldraw handle loading)", () => {
      mockStoreStatus = { status: "loading" };
      render(<TldrawEditor {...defaultProps} />);

      // Tldraw receives the status object directly — it handles loading internally
      expect(tldrawRenderCount).toBe(1);
      expect(lastTldrawProps?.store).toBe(mockStoreStatus);
    });

    it("passes synced store to Tldraw", () => {
      const mockStore = { id: "mock-store" };
      mockStoreStatus = {
        status: "synced-remote",
        connectionStatus: "online",
        store: mockStore,
      };
      render(<TldrawEditor {...defaultProps} />);

      expect(screen.getByTestId("tldraw-canvas")).toBeInTheDocument();
      expect(lastTldrawProps?.store).toBe(mockStoreStatus);
    });

    it("passes error status to Tldraw", () => {
      mockStoreStatus = { status: "error", error: new Error("connection failed") };
      render(<TldrawEditor {...defaultProps} />);

      // Tldraw handles error state internally
      expect(tldrawRenderCount).toBe(1);
      expect(lastTldrawProps?.store).toBe(mockStoreStatus);
    });
  });

  describe("userInfo memoization", () => {
    it("passes stable userInfo to useSyncDemo across re-renders", () => {
      mockStoreStatus = { status: "loading" };
      const { rerender } = render(<TldrawEditor {...defaultProps} />);

      const firstCallArgs = (useSyncDemo as ReturnType<typeof vi.fn>).mock.calls[0][0];

      rerender(<TldrawEditor {...defaultProps} />);
      const secondCallArgs = (useSyncDemo as ReturnType<typeof vi.fn>).mock.calls[1][0];

      // userInfo object reference should be the SAME (memoized)
      expect(firstCallArgs.userInfo).toBe(secondCallArgs.userInfo);
    });

    it("creates new userInfo when userName changes", () => {
      mockStoreStatus = { status: "loading" };
      const { rerender } = render(<TldrawEditor {...defaultProps} />);

      const firstCallArgs = (useSyncDemo as ReturnType<typeof vi.fn>).mock.calls[0][0];

      rerender(<TldrawEditor {...defaultProps} userName="다른유저" />);
      const secondCallArgs = (useSyncDemo as ReturnType<typeof vi.fn>).mock.calls[1][0];

      expect(firstCallArgs.userInfo).not.toBe(secondCallArgs.userInfo);
      expect(secondCallArgs.userInfo.name).toBe("다른유저");
    });

    it("creates new userInfo when userId changes", () => {
      mockStoreStatus = { status: "loading" };
      const { rerender } = render(<TldrawEditor {...defaultProps} />);

      const firstCallArgs = (useSyncDemo as ReturnType<typeof vi.fn>).mock.calls[0][0];

      rerender(<TldrawEditor {...defaultProps} userId="user-2" />);
      const secondCallArgs = (useSyncDemo as ReturnType<typeof vi.fn>).mock.calls[1][0];

      expect(firstCallArgs.userInfo).not.toBe(secondCallArgs.userInfo);
      expect(secondCallArgs.userInfo.id).toBe("user-2");
    });
  });

  describe("Tldraw props", () => {
    it("passes onMount callback to Tldraw", () => {
      mockStoreStatus = { status: "loading" };
      render(<TldrawEditor {...defaultProps} />);

      expect(lastTldrawProps?.onMount).toBeTypeOf("function");
    });

    it("passes components config to Tldraw", () => {
      mockStoreStatus = { status: "loading" };
      render(<TldrawEditor {...defaultProps} />);

      const comps = lastTldrawProps?.components as Record<string, unknown>;
      expect(comps).toBeDefined();
      expect(comps.PageMenu).toBeNull();
    });
  });
});

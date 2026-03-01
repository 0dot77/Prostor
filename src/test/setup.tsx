import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js modules
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>(
    "framer-motion"
  );
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy(actual.motion, {
      get: (_target, prop: string) => {
        // Return a simple forwardRef component for all motion.* elements
        if (typeof prop === "string") {
          return ({
            children,
            ...props
          }: {
            children?: React.ReactNode;
            [key: string]: unknown;
          }) => {
            const {
              initial: _i,
              animate: _a,
              exit: _e,
              transition: _t,
              layout: _l,
              whileHover: _wh,
              whileTap: _wt,
              variants: _v,
              ...domProps
            } = props;
            // Filter out non-DOM props
            const cleanProps: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(domProps)) {
              if (
                typeof val !== "function" ||
                key.startsWith("on") ||
                key === "ref"
              ) {
                cleanProps[key] = val;
              }
            }
            const Element = prop as keyof React.JSX.IntrinsicElements;
            return <Element {...cleanProps}>{children}</Element>;
          };
        }
        return undefined;
      },
    }),
  };
});

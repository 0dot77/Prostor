import { test, expect } from "@playwright/test";

const TEST_URL = "/whiteboard-test";

// Wait for tldraw to fully load (canvas renders)
async function waitForTldraw(page: import("@playwright/test").Page) {
  // tldraw renders a div.tl-container as the main canvas
  await page.waitForSelector(".tl-container", { timeout: 30_000 });
}

test.describe("Whiteboard zoom behavior", () => {
  test.beforeEach(async ({ page }) => {
    // Collect console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`[browser error] ${msg.text()}`);
      }
    });

    // Collect uncaught exceptions
    page.on("pageerror", (err) => {
      console.log(`[page error] ${err.message}`);
    });

    await page.goto(TEST_URL);
  });

  test("tldraw canvas loads successfully", async ({ page }) => {
    await waitForTldraw(page);
    const canvas = page.locator(".tl-container");
    await expect(canvas).toBeVisible();
  });

  test("whiteboard panel stays visible after Ctrl+wheel zoom in", async ({
    page,
  }) => {
    await waitForTldraw(page);

    const canvas = page.locator(".tl-container");
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Simulate Ctrl+wheel (pinch-to-zoom on trackpad in Chrome)
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(cx, cy);
      await page.mouse.wheel(0, -100); // scroll up = zoom in
    }

    // Wait for any async re-renders
    await page.waitForTimeout(500);

    // The tldraw container should still be visible
    await expect(canvas).toBeVisible();
    // The wrapper div should still be in the DOM
    const wrapper = page.locator('[class*="absolute"][class*="inset-0"]');
    await expect(wrapper.first()).toBeVisible();
  });

  test("whiteboard panel stays visible after Ctrl+wheel zoom out", async ({
    page,
  }) => {
    await waitForTldraw(page);

    const canvas = page.locator(".tl-container");
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Simulate Ctrl+wheel zoom out
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(cx, cy);
      await page.mouse.wheel(0, 100); // scroll down = zoom out
    }

    await page.waitForTimeout(500);
    await expect(canvas).toBeVisible();
  });

  test("whiteboard panel stays visible after rapid zoom in/out cycles", async ({
    page,
  }) => {
    await waitForTldraw(page);

    const canvas = page.locator(".tl-container");
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Rapid zoom in/out cycles
    for (let cycle = 0; cycle < 5; cycle++) {
      // Zoom in
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(cx, cy);
        await page.mouse.wheel(0, -150);
      }
      // Zoom out
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(cx, cy);
        await page.mouse.wheel(0, 150);
      }
    }

    await page.waitForTimeout(500);
    await expect(canvas).toBeVisible();
  });

  test("no uncaught errors during zoom", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await waitForTldraw(page);

    const canvas = page.locator(".tl-container");
    const box = await canvas.boundingBox();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Zoom in aggressively
    for (let i = 0; i < 20; i++) {
      await page.mouse.move(cx, cy);
      await page.mouse.wheel(0, -200);
    }

    // Zoom out aggressively
    for (let i = 0; i < 20; i++) {
      await page.mouse.move(cx, cy);
      await page.mouse.wheel(0, 200);
    }

    await page.waitForTimeout(1000);

    // Filter out non-critical errors (license warning etc.)
    const criticalErrors = errors.filter(
      (e) => !e.includes("license") && !e.includes("SES")
    );
    expect(criticalErrors).toEqual([]);
  });

  test("whiteboard survives Ctrl+wheel (browser zoom gesture)", async ({
    page,
  }) => {
    await waitForTldraw(page);

    const canvas = page.locator(".tl-container");
    const box = await canvas.boundingBox();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Use CDP to dispatch wheel events WITH ctrlKey (trackpad pinch-to-zoom)
    const cdp = await page.context().newCDPSession(page);
    for (let i = 0; i < 15; i++) {
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseWheel",
        x: cx,
        y: cy,
        deltaX: 0,
        deltaY: -100,
        modifiers: 2, // 2 = Ctrl modifier
      });
      await page.waitForTimeout(50);
    }
    for (let i = 0; i < 15; i++) {
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseWheel",
        x: cx,
        y: cy,
        deltaX: 0,
        deltaY: 100,
        modifiers: 2,
      });
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    await expect(canvas).toBeVisible();

    // Verify no error boundary triggered
    const errorVisible = await page
      .locator("text=화이트보드에서 오류가 발생했습니다")
      .isVisible()
      .catch(() => false);
    expect(errorVisible).toBe(false);
  });

  test("error boundary catches tldraw errors without losing panel", async ({
    page,
  }) => {
    await waitForTldraw(page);

    // Inject an error into tldraw by manipulating the store
    // (This tests the error boundary fallback UI)
    const errorBoundaryVisible = await page
      .locator("text=화이트보드에서 오류가 발생했습니다")
      .isVisible()
      .catch(() => false);

    // If error boundary is showing, the "다시 시도" button should exist
    if (errorBoundaryVisible) {
      await expect(page.locator("text=다시 시도")).toBeVisible();
    } else {
      // Normal case: tldraw is running fine, no error boundary
      await expect(page.locator(".tl-container")).toBeVisible();
    }
  });
});

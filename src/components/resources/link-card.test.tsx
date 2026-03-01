import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LinkCard } from "./link-card";
import type { Resource } from "@/lib/types";

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: "res-1",
    course_id: "course-1",
    week_id: null,
    url: "https://example.com/article",
    og_title: "Example Article",
    og_description: "An interesting article about testing",
    og_image: "https://example.com/og-image.jpg",
    og_site_name: "Example",
    added_by: "user-1",
    created_at: "2026-03-02T00:00:00Z",
    ...overrides,
  };
}

describe("LinkCard", () => {
  const defaultProps = {
    isAdmin: false,
    onDelete: vi.fn(),
    deleting: false,
  };

  it("renders with OG image as background", () => {
    const resource = makeResource();
    render(<LinkCard resource={resource} {...defaultProps} />);

    const img = screen.getByAltText("");
    expect(img).toBeInTheDocument();
    expect((img as HTMLImageElement).src).toBe(
      "https://example.com/og-image.jpg"
    );
  });

  it("renders brand badge for known sites", () => {
    const resource = makeResource({
      url: "https://youtube.com/watch?v=abc",
      og_title: "Cool Video",
    });
    render(<LinkCard resource={resource} {...defaultProps} />);

    expect(screen.getByText("YouTube")).toBeInTheDocument();
  });

  it("uses brand icon fallback when no OG image", () => {
    const resource = makeResource({
      url: "https://x.com/user/status/123",
      og_image: null,
      og_title: "A tweet",
    });
    render(<LinkCard resource={resource} {...defaultProps} />);

    // Should show X brand name
    expect(screen.getByText("X")).toBeInTheDocument();
  });

  it("filters out useless OG images (X.com warning emoji)", () => {
    const resource = makeResource({
      url: "https://x.com/user/status/123",
      og_image: "https://abs-0.twimg.com/emoji/v2/svg/26a0.svg",
      og_title: "A tweet",
    });
    render(<LinkCard resource={resource} {...defaultProps} />);

    // Should NOT render the useless emoji as an img
    const imgs = screen.queryAllByRole("img");
    const emojiImg = imgs.find(
      (img) =>
        (img as HTMLImageElement).src.includes("twimg.com/emoji")
    );
    expect(emojiImg).toBeUndefined();
  });

  it("renders title from og_title", () => {
    const resource = makeResource({ og_title: "My Article Title" });
    render(<LinkCard resource={resource} {...defaultProps} />);

    expect(screen.getByText("My Article Title")).toBeInTheDocument();
  });

  it("falls back to brand name for title", () => {
    const resource = makeResource({
      url: "https://github.com/user/repo",
      og_title: null,
    });
    render(<LinkCard resource={resource} {...defaultProps} />);

    // Brand name appears in both site name row and title — use getAllByText
    const elements = screen.getAllByText("GitHub");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to domain for title when no brand and no og_title", () => {
    const resource = makeResource({
      url: "https://random-site.xyz/page",
      og_title: null,
    });
    render(<LinkCard resource={resource} {...defaultProps} />);

    // Domain appears in both site name row and title area
    const elements = screen.getAllByText("random-site.xyz");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("opens link in new tab", () => {
    const resource = makeResource();
    render(<LinkCard resource={resource} {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows delete button for admin", () => {
    const resource = makeResource();
    render(<LinkCard resource={resource} {...defaultProps} isAdmin={true} />);

    const deleteBtn = screen.getByRole("button");
    expect(deleteBtn).toBeInTheDocument();
  });

  it("hides delete button for non-admin", () => {
    const resource = makeResource();
    render(
      <LinkCard resource={resource} {...defaultProps} isAdmin={false} />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    const resource = makeResource();
    render(
      <LinkCard
        resource={resource}
        isAdmin={true}
        onDelete={onDelete}
        deleting={false}
      />
    );

    const deleteBtn = screen.getByRole("button");
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith("res-1");
  });

  it("prevents link navigation when delete button is clicked", () => {
    const onDelete = vi.fn();
    const resource = makeResource();
    render(
      <LinkCard
        resource={resource}
        isAdmin={true}
        onDelete={onDelete}
        deleting={false}
      />
    );

    const deleteBtn = screen.getByRole("button");
    const clickEvent = new MouseEvent("click", { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
    const stopPropagationSpy = vi.spyOn(clickEvent, "stopPropagation");

    deleteBtn.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});

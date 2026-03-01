import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AssignmentCard } from "./assignment-card";
import type { AssignmentWithUser } from "@/lib/types";

const mockAssignment: AssignmentWithUser = {
  id: "assign-1",
  week_id: "week-1",
  user_id: "user-1",
  title: "1주차 - 유태양",
  description: "간단간단",
  image_url: "https://storage.example.com/main.webp",
  thumbnail_url: "https://storage.example.com/thumb.webp",
  created_at: "2026-03-02T00:00:00Z",
  users: {
    id: "user-1",
    name: "Taeyang Yoo",
    avatar_url: null,
  },
};

describe("AssignmentCard", () => {
  const defaultProps = {
    assignment: mockAssignment,
    currentUserId: "user-1",
    isAdmin: false,
    onImageClick: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it("renders title and description", () => {
    render(<AssignmentCard {...defaultProps} />);

    expect(screen.getByText("1주차 - 유태양")).toBeInTheDocument();
    expect(screen.getByText("간단간단")).toBeInTheDocument();
  });

  it("renders author name", () => {
    render(<AssignmentCard {...defaultProps} />);

    expect(screen.getByText("Taeyang Yoo")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<AssignmentCard {...defaultProps} />);

    // Korean locale date
    expect(screen.getByText("3월 2일")).toBeInTheDocument();
  });

  it("renders image with thumbnail_url by default", () => {
    render(<AssignmentCard {...defaultProps} />);

    const img = screen.getByAltText("1주차 - 유태양") as HTMLImageElement;
    expect(img.src).toBe("https://storage.example.com/thumb.webp");
  });

  it("calls onImageClick when image area is clicked", () => {
    const onImageClick = vi.fn();
    render(<AssignmentCard {...defaultProps} onImageClick={onImageClick} />);

    const img = screen.getByAltText("1주차 - 유태양");
    fireEvent.click(img.parentElement!);

    expect(onImageClick).toHaveBeenCalledWith(mockAssignment);
  });

  it("shows skeleton before image loads", () => {
    const { container } = render(<AssignmentCard {...defaultProps} />);

    // Skeleton should be visible (animate-pulse)
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();

    // Image should have opacity: 0 (not visible yet)
    const img = screen.getByAltText("1주차 - 유태양") as HTMLImageElement;
    expect(img.style.opacity).toBe("0");
  });

  it("hides skeleton after image loads", () => {
    const { container } = render(<AssignmentCard {...defaultProps} />);

    const img = screen.getByAltText("1주차 - 유태양") as HTMLImageElement;
    fireEvent.load(img);

    // After load, skeleton should be gone
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).not.toBeInTheDocument();
  });

  it("falls back to image_url when thumbnail fails", async () => {
    render(<AssignmentCard {...defaultProps} />);

    const img = screen.getByAltText("1주차 - 유태양") as HTMLImageElement;
    expect(img.src).toContain("thumb.webp");

    // Simulate error — triggers state update
    fireEvent.error(img);

    // After re-render, the img src should change to main image
    const updatedImg = screen.getByAltText("1주차 - 유태양") as HTMLImageElement;
    expect(updatedImg.src).toContain("main.webp");
  });

  it("shows edit/delete menu for the assignment owner", () => {
    render(<AssignmentCard {...defaultProps} currentUserId="user-1" />);

    // Menu trigger button should exist (hidden until hover, but in DOM)
    const menuButton = screen.getByRole("button");
    expect(menuButton).toBeInTheDocument();
  });

  it("hides edit/delete menu for other users", () => {
    render(
      <AssignmentCard
        {...defaultProps}
        currentUserId="other-user"
        isAdmin={false}
      />
    );

    // No menu button should exist
    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });

  it("shows edit/delete menu for admin regardless of ownership", () => {
    render(
      <AssignmentCard
        {...defaultProps}
        currentUserId="admin-user"
        isAdmin={true}
      />
    );

    const menuButton = screen.getByRole("button");
    expect(menuButton).toBeInTheDocument();
  });

  it("handles missing title gracefully", () => {
    const noTitleAssignment = { ...mockAssignment, title: null };
    render(
      <AssignmentCard {...defaultProps} assignment={noTitleAssignment} />
    );

    // Should not crash, and image alt should fallback
    const img = screen.getByAltText("과제 이미지");
    expect(img).toBeInTheDocument();
  });

  it("handles missing description gracefully", () => {
    const noDescAssignment = { ...mockAssignment, description: null };
    render(
      <AssignmentCard {...defaultProps} assignment={noDescAssignment} />
    );

    expect(screen.queryByText("간단간단")).not.toBeInTheDocument();
  });
});

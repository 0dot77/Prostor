import type { User } from "@/lib/types";

/**
 * Get the display name for a user.
 * Falls back to email prefix if name is null.
 */
export function getDisplayName(user: Pick<User, "name" | "email">): string {
  return user.name ?? user.email.split("@")[0];
}

/**
 * Get 1-2 character initials from a display name.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

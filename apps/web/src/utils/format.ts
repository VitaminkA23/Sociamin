import type { Author } from "../types/post";

export function getDisplayName(author: Pick<Author, "email" | "phoneNumber"> & { displayName?: string | null }): string {
  if (author.displayName) return author.displayName;
  if (author.email) {
    const prefix = author.email.split("@")[0] ?? "";
    return (prefix.charAt(0).toUpperCase() + prefix.slice(1)).replace(/[._-]+/g, " ");
  }
  if (author.phoneNumber) return author.phoneNumber;
  return "Anonymous";
}

export function getInitials(author: Pick<Author, "email" | "phoneNumber">): string {
  return getDisplayName(author).charAt(0).toUpperCase();
}

const AVATAR_PALETTE = [
  "#1F5A49", "#2D7A62", "#3D8B70", "#5A6E5A",
  "#4A7C68", "#3B6E5C", "#2C5F50", "#1E4D3F",
] as const;
const AVATAR_FALLBACK = "#1F5A49";

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length] ?? AVATAR_FALLBACK;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (s < 60) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
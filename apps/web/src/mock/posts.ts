import type { Post, Comment, Author } from "../types/post";

// ── Helpers ──────────────────────────────────────────────────────────────────

let idCounter = 100;
function uid(): string { return `mock-${++idCounter}`; }

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Seed data ─────────────────────────────────────────────────────────────────

export const CURRENT_USER: Author = {
  id: "user-current",
  email: "alex@vitamina.app",
  phoneNumber: null,
};

const authors: Author[] = [
  { id: "user-2", email: "sofia.h@vitamina.app", phoneNumber: null },
  { id: "user-3", email: "marcus.j@vitamina.app", phoneNumber: null },
  { id: "user-4", email: null, phoneNumber: "+1 555 012 3456" },
  { id: "user-5", email: "priya.k@vitamina.app", phoneNumber: null },
  { id: "user-6", email: "tom.w@vitamina.app", phoneNumber: null },
];

// Active users shown in the right panel
export const ACTIVE_USERS: Author[] = [
  authors[0] as Author,
  authors[1] as Author,
  authors[3] as Author,
  authors[4] as Author,
  { id: "user-7", email: "nina.r@vitamina.app", phoneNumber: null },
];

const SEED_COMMENTS: Record<string, Comment[]> = {
  "post-1": [
    {
      id: "c-1",
      content: "This is exactly what I needed to hear today! 🌱",
      createdAt: hoursAgo(1),
      author: authors[3] as Author,
    },
    {
      id: "c-2",
      content: "Starting my morning walks this week. Thanks for the reminder!",
      createdAt: hoursAgo(0.5),
      author: authors[4] as Author,
    },
  ],
  "post-3": [
    {
      id: "c-3",
      content: "Congrats! Well deserved 🎉",
      createdAt: hoursAgo(3),
      author: authors[0] as Author,
    },
  ],
};

const SEED_POSTS: Post[] = [
  {
    id: "post-1",
    content:
      "Small habits compound into big results. Took a 20-minute walk every morning for 30 days and my energy levels have been completely transformed. What small habit has made the biggest difference in your life?",
    imageUrl: "https://picsum.photos/seed/vitamina-walk/620/360",
    createdAt: hoursAgo(2),
    author: authors[0] as Author,
    likesCount: 42,
    commentsCount: 2,
    isLikedByMe: false,
    comments: SEED_COMMENTS["post-1"] ?? [],
  },
  {
    id: "post-2",
    content:
      "Hot take: the best productivity app is a glass of water and 10 minutes outside. Works every time. 🌿",
    imageUrl: null,
    createdAt: hoursAgo(5),
    author: authors[1] as Author,
    likesCount: 118,
    commentsCount: 0,
    isLikedByMe: true,
    comments: [],
  },
  {
    id: "post-3",
    content:
      "Just finished my first 5K run! Couldn't have done it without this community cheering me on for the past 8 weeks. Thank you all — this one's for everyone who said they'd start 'next Monday' 😄",
    imageUrl: "https://picsum.photos/seed/vitamina-run/620/380",
    createdAt: hoursAgo(11),
    author: authors[2] as Author,
    likesCount: 203,
    commentsCount: 1,
    isLikedByMe: false,
    comments: SEED_COMMENTS["post-3"] ?? [],
  },
  {
    id: "post-4",
    content:
      "Sharing this roasted chickpea and sweet potato bowl I made last night. High protein, zero guilt, and ready in 25 minutes. Recipe in the comments 👇",
    imageUrl: "https://picsum.photos/seed/vitamina-food/620/400",
    createdAt: hoursAgo(18),
    author: authors[3] as Author,
    likesCount: 87,
    commentsCount: 0,
    isLikedByMe: false,
    comments: [],
  },
  {
    id: "post-5",
    content:
      "Reminder that rest is not laziness. Recovery is part of the process. Sleep 8 hours, take your days off, and come back stronger.",
    imageUrl: null,
    createdAt: hoursAgo(26),
    author: authors[4] as Author,
    likesCount: 314,
    commentsCount: 0,
    isLikedByMe: true,
    comments: [],
  },
];

// ── Mock API surface ──────────────────────────────────────────────────────────

export async function fetchFeed(): Promise<Post[]> {
  await delay(600);
  return SEED_POSTS.map((p) => ({ ...p }));
}

export async function createPost(
  content: string,
  imageUrl: string | null
): Promise<Post> {
  await delay(500);
  return {
    id: uid(),
    content,
    imageUrl,
    createdAt: new Date().toISOString(),
    author: CURRENT_USER,
    likesCount: 0,
    commentsCount: 0,
    isLikedByMe: false,
    comments: [],
  };
}

export async function mockToggleLike(
  _postId: string,
  _liked: boolean
): Promise<void> {
  await delay(80);
}

export async function mockAddComment(
  postId: string,
  content: string
): Promise<Comment> {
  await delay(300);
  return {
    id: uid(),
    content,
    createdAt: new Date().toISOString(),
    author: CURRENT_USER,
  };
  // postId intentionally unused in mock — real API will use it
  void postId;
}
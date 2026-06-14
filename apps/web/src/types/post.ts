export interface Author {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

export interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: Author;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  comments: Comment[];
}
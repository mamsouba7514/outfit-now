export interface SocialUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
}

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface PostOutfitItem {
  id: string;
  imageUrl?: string;
  category: string;
  primaryColor?: string;
}

export interface PostOutfit {
  id: string;
  justification: string;
  score: number;
  items: PostOutfitItem[];
}

export interface Post {
  id: string;
  author: PostAuthor;
  outfit: PostOutfit | null;
  caption: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: PostAuthor;
  content: string;
  createdAt: string;
}

export interface FeedResponse {
  data: Post[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface CommentsResponse {
  data: Comment[];
  hasMore: boolean;
}

export interface CreatePostRequest {
  outfitId: string;
  caption?: string;
}

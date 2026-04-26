import type {
  FeedResponse,
  CommentsResponse,
  Comment,
  Post,
  CreatePostRequest,
} from '@outfit-now/shared-types';

import { apiRequest } from './api';

export async function getFeed(cursor?: string): Promise<FeedResponse> {
  const params = new URLSearchParams({ pageSize: '20' });
  if (cursor) params.set('cursor', cursor);
  return apiRequest<FeedResponse>(`/v1/social/feed?${params}`);
}

export async function getExplore(cursor?: string): Promise<FeedResponse> {
  const params = new URLSearchParams({ pageSize: '20' });
  if (cursor) params.set('cursor', cursor);
  return apiRequest<FeedResponse>(`/v1/social/explore?${params}`);
}

export async function createPost(data: CreatePostRequest): Promise<{ id: string }> {
  return apiRequest('/v1/social/posts', { method: 'POST', body: JSON.stringify(data) });
}

export async function deletePost(postId: string): Promise<void> {
  await apiRequest(`/v1/social/posts/${postId}`, { method: 'DELETE' });
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
  return apiRequest(`/v1/social/posts/${postId}/like`, { method: 'POST' });
}

export async function getComments(postId: string, cursor?: string): Promise<CommentsResponse> {
  const params = new URLSearchParams({ pageSize: '30' });
  if (cursor) params.set('cursor', cursor);
  return apiRequest<CommentsResponse>(`/v1/social/posts/${postId}/comments?${params}`);
}

export async function addComment(postId: string, content: string): Promise<Comment> {
  return apiRequest<Comment>(`/v1/social/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await apiRequest(`/v1/social/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
}

export async function toggleFollow(userId: string): Promise<{ following: boolean }> {
  return apiRequest(`/v1/social/users/${userId}/follow`, { method: 'POST' });
}

export async function getUserProfile(userId: string) {
  return apiRequest<{
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    bio: string | null;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    isFollowing: boolean;
    posts: Post[];
  }>(`/v1/social/users/${userId}`);
}

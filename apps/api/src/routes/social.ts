import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { createPresignedDownloadUrl } from '../lib/s3.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function enrichPostItems(items: Array<{
  dressingItem: {
    id: string;
    imageKey: string;
    thumbnailKey: string | null;
    category: string | null;
    primaryColor: string | null;
  };
}>) {
  return Promise.all(
    items.map(async (i) => {
      const key = i.dressingItem.thumbnailKey ?? i.dressingItem.imageKey;
      const imageUrl = await createPresignedDownloadUrl(key).catch(() => undefined);
      return {
        id: i.dressingItem.id,
        imageUrl,
        category: i.dressingItem.category ?? 'other',
        primaryColor: i.dressingItem.primaryColor ?? undefined,
      };
    }),
  );
}

async function formatPost(
  post: {
    id: string;
    caption: string | null;
    createdAt: Date;
    user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
    outfit: {
      id: string;
      justification: string | null;
      score: number;
      items: Array<{
        dressingItem: {
          id: string;
          imageKey: string;
          thumbnailKey: string | null;
          category: string | null;
          primaryColor: string | null;
        };
      }>;
    } | null;
    _count: { likes: number; comments: number };
  },
  likedPostIds: Set<string>,
) {
  const outfitItems = post.outfit
    ? await enrichPostItems(post.outfit.items)
    : [];

  return {
    id: post.id,
    author: {
      id: post.user.id,
      firstName: post.user.firstName,
      lastName: post.user.lastName,
      avatarUrl: post.user.avatarUrl,
    },
    outfit: post.outfit
      ? {
          id: post.outfit.id,
          justification: post.outfit.justification ?? '',
          score: post.outfit.score,
          items: outfitItems,
        }
      : null,
    caption: post.caption,
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    isLiked: likedPostIds.has(post.id),
    createdAt: post.createdAt.toISOString(),
  };
}

const POST_SELECT = {
  id: true,
  caption: true,
  createdAt: true,
  user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  outfit: {
    select: {
      id: true,
      justification: true,
      score: true,
      items: {
        select: {
          dressingItem: {
            select: { id: true, imageKey: true, thumbnailKey: true, category: true, primaryColor: true },
          },
        },
        take: 6,
      },
    },
  },
  _count: { select: { likes: true, comments: true } },
} as const;

// ─── Routes ─────────────────────────────────────────────────────────────────

export async function socialRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  // ── GET /v1/social/feed — posts des gens suivis + soi-même ────────────────
  app.get('/v1/social/feed', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const query = z.object({
      cursor: z.string().optional(),
      pageSize: z.coerce.number().int().min(1).max(50).default(20),
    }).parse(request.query);

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    const authorIds = [userId, ...followingIds];

    const posts = await prisma.post.findMany({
      where: {
        userId: { in: authorIds },
        deletedAt: null,
        ...(query.cursor ? { createdAt: { lt: new Date(query.cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: query.pageSize + 1,
      select: POST_SELECT,
    });

    const hasMore = posts.length > query.pageSize;
    const slice = hasMore ? posts.slice(0, query.pageSize) : posts;

    const likedIds = await prisma.like.findMany({
      where: { userId, postId: { in: slice.map((p) => p.id) } },
      select: { postId: true },
    });
    const likedSet = new Set(likedIds.map((l) => l.postId));

    const data = await Promise.all(slice.map((p) => formatPost(p, likedSet)));

    return reply.send({
      data,
      hasMore,
      nextCursor: hasMore ? slice[slice.length - 1]?.createdAt.toISOString() ?? null : null,
    });
  });

  // ── GET /v1/social/explore — tous les posts publics ───────────────────────
  app.get('/v1/social/explore', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const query = z.object({
      cursor: z.string().optional(),
      pageSize: z.coerce.number().int().min(1).max(50).default(20),
    }).parse(request.query);

    const posts = await prisma.post.findMany({
      where: {
        deletedAt: null,
        ...(query.cursor ? { createdAt: { lt: new Date(query.cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: query.pageSize + 1,
      select: POST_SELECT,
    });

    const hasMore = posts.length > query.pageSize;
    const slice = hasMore ? posts.slice(0, query.pageSize) : posts;

    const likedIds = await prisma.like.findMany({
      where: { userId, postId: { in: slice.map((p) => p.id) } },
      select: { postId: true },
    });
    const likedSet = new Set(likedIds.map((l) => l.postId));

    const data = await Promise.all(slice.map((p) => formatPost(p, likedSet)));

    return reply.send({
      data,
      hasMore,
      nextCursor: hasMore ? slice[slice.length - 1]?.createdAt.toISOString() ?? null : null,
    });
  });

  // ── POST /v1/social/posts — créer un post ─────────────────────────────────
  app.post('/v1/social/posts', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = z.object({
      outfitId: z.string(),
      caption: z.string().max(500).optional(),
    }).safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    // Verify the outfit belongs to the user
    const outfit = await prisma.outfit.findFirst({
      where: { id: body.data.outfitId, brief: { userId } },
    });
    if (!outfit) return reply.status(404).send({ message: 'Outfit not found' });

    const post = await prisma.post.create({
      data: {
        userId,
        outfitId: body.data.outfitId,
        caption: body.data.caption ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return reply.status(201).send(post);
  });

  // ── DELETE /v1/social/posts/:postId ──────────────────────────────────────
  app.delete('/v1/social/posts/:postId', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { postId } = request.params as { postId: string };

    const post = await prisma.post.findFirst({ where: { id: postId, userId, deletedAt: null } });
    if (!post) return reply.status(404).send({ message: 'Post not found' });

    await prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });
    return reply.status(204).send();
  });

  // ── POST /v1/social/posts/:postId/like — toggle like ─────────────────────
  app.post('/v1/social/posts/:postId/like', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { postId } = request.params as { postId: string };

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { userId_postId: { userId, postId } } });
      const count = await prisma.like.count({ where: { postId } });
      return reply.send({ liked: false, likesCount: count });
    } else {
      await prisma.like.create({ data: { userId, postId } });
      const count = await prisma.like.count({ where: { postId } });
      return reply.send({ liked: true, likesCount: count });
    }
  });

  // ── GET /v1/social/posts/:postId/comments ────────────────────────────────
  app.get('/v1/social/posts/:postId/comments', auth, async (request, reply) => {
    const { postId } = request.params as { postId: string };
    const query = z.object({
      cursor: z.string().optional(),
      pageSize: z.coerce.number().int().min(1).max(50).default(30),
    }).parse(request.query);

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        deletedAt: null,
        ...(query.cursor ? { createdAt: { lt: new Date(query.cursor) } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: query.pageSize + 1,
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    const hasMore = comments.length > query.pageSize;
    const slice = hasMore ? comments.slice(0, query.pageSize) : comments;

    return reply.send({
      data: slice.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.user.id,
          firstName: c.user.firstName,
          lastName: c.user.lastName,
          avatarUrl: c.user.avatarUrl,
        },
      })),
      hasMore,
    });
  });

  // ── POST /v1/social/posts/:postId/comments ───────────────────────────────
  app.post('/v1/social/posts/:postId/comments', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { postId } = request.params as { postId: string };
    const body = z.object({ content: z.string().min(1).max(1000) }).safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
    if (!post) return reply.status(404).send({ message: 'Post not found' });

    const comment = await prisma.comment.create({
      data: { userId, postId, content: body.data.content },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    return reply.status(201).send({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.user.id,
        firstName: comment.user.firstName,
        lastName: comment.user.lastName,
        avatarUrl: comment.user.avatarUrl,
      },
    });
  });

  // ── DELETE /v1/social/posts/:postId/comments/:commentId ─────────────────
  app.delete('/v1/social/posts/:postId/comments/:commentId', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { commentId } = request.params as { postId: string; commentId: string };

    const comment = await prisma.comment.findFirst({ where: { id: commentId, userId, deletedAt: null } });
    if (!comment) return reply.status(404).send({ message: 'Comment not found' });

    await prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
    return reply.status(204).send();
  });

  // ── POST /v1/social/users/:userId/follow — toggle follow ─────────────────
  app.post('/v1/social/users/:userId/follow', auth, async (request, reply) => {
    const { id: followerId } = request.user as { id: string };
    const { userId: followingId } = request.params as { userId: string };

    if (followerId === followingId) {
      return reply.status(400).send({ message: 'Cannot follow yourself' });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId } } });
      return reply.send({ following: false });
    } else {
      await prisma.follow.create({ data: { followerId, followingId } });
      return reply.send({ following: true });
    }
  });

  // ── GET /v1/social/users/:userId — profil public ─────────────────────────
  app.get('/v1/social/users/:userId', auth, async (request, reply) => {
    const { id: viewerId } = request.user as { id: string };
    const { userId } = request.params as { userId: string };

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true, firstName: true, lastName: true, avatarUrl: true, bio: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });
    if (!user) return reply.status(404).send({ message: 'User not found' });

    const isFollowing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
    });

    const posts = await prisma.post.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: POST_SELECT,
    });

    const likedIds = await prisma.like.findMany({
      where: { userId: viewerId, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true },
    });
    const likedSet = new Set(likedIds.map((l) => l.postId));

    const formattedPosts = await Promise.all(posts.map((p) => formatPost(p, likedSet)));

    return reply.send({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      postsCount: user._count.posts,
      isFollowing: !!isFollowing,
      posts: formattedPosts,
    });
  });
}

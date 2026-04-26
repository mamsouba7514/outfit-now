import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@outfit-now/design-tokens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getUserProfile, toggleFollow, toggleLike } from '../../../../lib/social';
import type { Post } from '@outfit-now/shared-types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 3) / 3;

// ─── Time helper ────────────────────────────────────────────────────────────

function getTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'À l\'instant';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}j`;
  return `${Math.floor(d / 7)}sem`;
}

// ─── Grid Post Thumb ─────────────────────────────────────────────────────────

function PostThumb({ post, onPress }: { post: Post; onPress: () => void }) {
  const firstImage = post.outfit?.items?.[0]?.imageUrl;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.gridItem}>
      {firstImage ? (
        <Image source={{ uri: firstImage }} style={styles.gridImage} resizeMode="cover" />
      ) : (
        <View style={[styles.gridImage, styles.gridPlaceholder]}>
          <Text style={styles.gridPlaceholderIcon}>◈</Text>
        </View>
      )}
      <View style={styles.gridOverlay}>
        <Ionicons name="heart" size={12} color="#fff" />
        <Text style={styles.gridLikeCount}>{post.likesCount}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Post Detail Card ─────────────────────────────────────────────────────────

function PostCard({ post, onLike }: { post: Post; onLike: (postId: string) => void }) {
  return (
    <View style={styles.postCard}>
      {/* Outfit items strip */}
      {post.outfit && post.outfit.items.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsStrip}>
          {post.outfit.items.map((item) => (
            <View key={item.id} style={styles.outfitItemBox}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.outfitItemImg} resizeMode="cover" />
              ) : (
                <View style={[styles.outfitItemImg, styles.itemPlaceholder]}>
                  <Text style={{ color: colors.neutral[600], fontSize: 18 }}>◈</Text>
                </View>
              )}
              {item.category && (
                <Text style={styles.outfitItemCategory}>{item.category.toUpperCase()}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Justification */}
      {post.outfit?.justification ? (
        <Text style={styles.justification} numberOfLines={2}>{post.outfit.justification}</Text>
      ) : null}

      {/* Caption */}
      {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.likeBtn} onPress={() => onLike(post.id)} activeOpacity={0.7}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={post.isLiked ? colors.primary[400] : colors.neutral[400]}
          />
          <Text style={[styles.footerCount, post.isLiked && { color: colors.primary[400] }]}>
            {post.likesCount}
          </Text>
        </TouchableOpacity>
        <View style={styles.likeBtn}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.neutral[400]} />
          <Text style={styles.footerCount}>{post.commentsCount}</Text>
        </View>
        <Text style={styles.timeAgo}>{getTimeAgo(post.createdAt)}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

type ProfileData = {
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
};

type ViewMode = 'grid' | 'list';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getUserProfile(userId)
      .then((data) => {
        setProfile(data);
        setPosts(data.posts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = useCallback(async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    try {
      const result = await toggleFollow(profile.id);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: result.following,
              followersCount: prev.followersCount + (result.following ? 1 : -1),
            }
          : prev,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  }, [profile, followLoading]);

  const handleLike = useCallback(async (postId: string) => {
    try {
      const result = await toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: result.liked, likesCount: result.likesCount }
            : p,
        ),
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary[400]} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Profil introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>RETOUR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Header ───────────────────────────────────────────────────────────────

  const ListHeader = (
    <View>
      {/* Top nav */}
      <View style={[styles.topNav, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backArrow}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[0]} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>
          {profile.firstName.toUpperCase()} {profile.lastName.toUpperCase()}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Profile info */}
      <View style={styles.profileSection}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {profile.firstName[0]}{profile.lastName[0]}
              </Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.postsCount}</Text>
            <Text style={styles.statLabel}>POSTS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.followersCount}</Text>
            <Text style={styles.statLabel}>ABONNÉS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.followingCount}</Text>
            <Text style={styles.statLabel}>ABONNEMENTS</Text>
          </View>
        </View>

        {/* Name + bio */}
        <Text style={styles.fullName}>
          {profile.firstName} {profile.lastName}
        </Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        {/* Follow button */}
        <TouchableOpacity
          onPress={handleFollow}
          activeOpacity={0.8}
          style={[styles.followBtn, profile.isFollowing && styles.followBtnActive]}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color={profile.isFollowing ? colors.neutral[0] : colors.neutral[950]} />
          ) : (
            <Text style={[styles.followBtnText, profile.isFollowing && styles.followBtnTextActive]}>
              {profile.isFollowing ? 'ABONNÉ' : 'S\'ABONNER'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* View mode toggle */}
      <View style={styles.viewToggle}>
        <View style={styles.separator} />
        <TouchableOpacity
          onPress={() => setViewMode('grid')}
          style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
          hitSlop={8}
        >
          <Ionicons
            name="grid-outline"
            size={18}
            color={viewMode === 'grid' ? colors.primary[400] : colors.neutral[500]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setViewMode('list')}
          style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
          hitSlop={8}
        >
          <Ionicons
            name="list-outline"
            size={20}
            color={viewMode === 'list' ? colors.primary[400] : colors.neutral[500]}
          />
        </TouchableOpacity>
        <View style={styles.separator} />
      </View>
    </View>
  );

  // ── Grid mode ────────────────────────────────────────────────────────────

  if (viewMode === 'grid') {
    const rows: Post[][] = [];
    for (let i = 0; i < posts.length; i += 3) rows.push(posts.slice(i, i + 3));

    return (
      <View style={styles.root}>
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          renderItem={({ item: row }) => (
            <View style={styles.gridRow}>
              {row.map((post) => (
                <PostThumb
                  key={post.id}
                  post={post}
                  onPress={() => setViewMode('list')}
                />
              ))}
              {row.length < 3 &&
                Array.from({ length: 3 - row.length }).map((_, i) => (
                  <View key={i} style={[styles.gridItem, { backgroundColor: 'transparent' }]} />
                ))}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  // ── List mode ────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) => (
          <PostCard post={item} onLike={handleLike} />
        )}
        ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◈</Text>
            <Text style={styles.emptyText}>AUCUN POST</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral[950],
  },

  // Top nav
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  backArrow: {
    width: 34,
    height: 34,
    justifyContent: 'center',
  },
  topNavTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
    letterSpacing: 2,
  },

  // Profile section
  profileSection: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  avatarWrapper: {
    marginBottom: spacing[3],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.primary[400],
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.primary[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[400],
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[4],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
  },
  statLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[500],
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.neutral[800],
  },
  fullName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[100],
    marginBottom: 4,
  },
  bio: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  followBtn: {
    backgroundColor: colors.primary[400],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[6],
    alignSelf: 'flex-start',
    marginTop: spacing[1],
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.neutral[600],
  },
  followBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[950],
    letterSpacing: 2,
  },
  followBtnTextActive: {
    color: colors.neutral[400],
  },

  // View toggle
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[800],
  },
  toggleBtn: {
    padding: spacing[2],
  },
  toggleBtnActive: {
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[400],
  },

  // Grid
  gridRow: {
    flexDirection: 'row',
    gap: 1.5,
    marginBottom: 1.5,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    backgroundColor: colors.neutral[900],
    position: 'relative',
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    backgroundColor: colors.neutral[900],
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPlaceholderIcon: {
    fontSize: 24,
    color: colors.neutral[700],
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridLikeCount: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
  },

  // Post card (list mode)
  postCard: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  postSeparator: {
    height: 1,
    backgroundColor: colors.neutral[900],
    marginHorizontal: spacing[4],
  },
  itemsStrip: {
    marginBottom: spacing[2],
  },
  outfitItemBox: {
    marginRight: spacing[2],
    alignItems: 'center',
  },
  outfitItemImg: {
    width: 72,
    height: 88,
    backgroundColor: colors.neutral[900],
  },
  itemPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitItemCategory: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 1,
    marginTop: 4,
  },
  justification: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: spacing[1],
  },
  caption: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[200],
    lineHeight: 20,
    marginBottom: spacing[2],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[1],
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerCount: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    fontWeight: typography.fontWeight.medium,
  },
  timeAgo: {
    marginLeft: 'auto',
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
  },

  // Error / empty
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
    letterSpacing: 1,
    marginBottom: spacing[4],
  },
  backBtn: {
    borderWidth: 1,
    borderColor: colors.neutral[700],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[6],
  },
  backBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[300],
    letterSpacing: 2,
  },
  emptyState: {
    flex: 1,
    paddingTop: 64,
    alignItems: 'center',
    gap: spacing[3],
  },
  emptyIcon: {
    fontSize: 40,
    color: colors.neutral[800],
  },
  emptyText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    letterSpacing: 3,
  },
});

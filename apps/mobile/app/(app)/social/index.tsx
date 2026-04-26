import { colors, typography, spacing } from '@outfit-now/design-tokens';
import type { Post } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useAuthStore } from '../../../hooks/useAuth';
import {
  getFeed,
  getExplore,
  toggleLike,
  addComment,
  getComments,
  deletePost,
  createPost,
} from '../../../lib/social';
import { getOutfits } from '../../../lib/briefs';
import type { Outfit } from '@outfit-now/shared-types';
import type { Comment } from '@outfit-now/shared-types';

type Tab = 'feed' | 'explore';

// ── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onDelete,
  onAuthorPress,
}: {
  post: Post;
  currentUserId: string;
  onLike: (postId: string) => void;
  onComment: (post: Post) => void;
  onDelete: (postId: string) => void;
  onAuthorPress: (userId: string) => void;
}) {
  const isOwner = post.author.id === currentUserId;
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <View style={styles.card}>
      {/* Author row */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => onAuthorPress(post.author.id)}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            {post.author.avatarUrl ? (
              <Image source={{ uri: post.author.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarInitials}>
                {post.author.firstName[0]}{post.author.lastName[0]}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.authorName}>
              {post.author.firstName} {post.author.lastName}
            </Text>
            <Text style={styles.postTime}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity
            onPress={() => Alert.alert('Supprimer', 'Supprimer ce post ?', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(post.id) },
            ])}
            style={styles.moreBtn}
          >
            <Text style={styles.moreBtnText}>···</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Outfit items strip */}
      {post.outfit && post.outfit.items.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.itemsStrip}
        >
          {post.outfit.items.map((item) => (
            <View key={item.id} style={styles.itemThumb}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemThumbImage} contentFit="cover" />
              ) : (
                <View style={styles.itemThumbPlaceholder}>
                  <Text style={styles.itemThumbIcon}>◈</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Outfit justification */}
      {post.outfit?.justification ? (
        <Text style={styles.outfitJustif} numberOfLines={2}>
          {post.outfit.justification}
        </Text>
      ) : null}

      {/* Caption */}
      {post.caption ? (
        <Text style={styles.caption}>{post.caption}</Text>
      ) : null}

      {/* Score badge */}
      {post.outfit && (
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeText}>
            SCORE {Math.round(post.outfit.score * 100)}%
          </Text>
        </View>
      )}

      {/* Actions row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onLike(post.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionIcon, post.isLiked && styles.actionIconLiked]}>
            {post.isLiked ? '♥' : '♡'}
          </Text>
          <Text style={[styles.actionCount, post.isLiked && styles.actionCountLiked]}>
            {post.likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onComment(post)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>◎</Text>
          <Text style={styles.actionCount}>{post.commentsCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Comment Sheet ────────────────────────────────────────────────────────────

function CommentSheet({
  post,
  currentUserId,
  visible,
  onClose,
}: {
  post: Post | null;
  currentUserId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!post || !visible) return;
    setLoading(true);
    setComments([]);
    getComments(post.id)
      .then((res) => setComments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [post?.id, visible]);

  async function handleSend() {
    if (!post || !input.trim()) return;
    setSending(true);
    try {
      const comment = await addComment(post.id, input.trim());
      setComments((prev) => [...prev, comment]);
      setInput('');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le commentaire.');
    } finally {
      setSending(false);
    }
  }

  if (!post) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.sheetBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>COMMENTAIRES</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary[400]} style={{ marginTop: spacing[6] }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              style={styles.commentList}
              ListEmptyComponent={
                <Text style={styles.noComments}>Sois le premier à commenter.</Text>
              }
              renderItem={({ item: c }) => (
                <View style={styles.commentRow}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {c.author.firstName[0]}{c.author.lastName[0]}
                    </Text>
                  </View>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>
                      {c.author.firstName} {c.author.lastName}
                    </Text>
                    <Text style={styles.commentContent}>{c.content}</Text>
                    <Text style={styles.commentTime}>{getTimeAgo(c.createdAt)}</Text>
                  </View>
                </View>
              )}
            />
          )}

          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ajouter un commentaire…"
              placeholderTextColor={colors.neutral[700]}
              multiline
              maxLength={500}
              keyboardAppearance="dark"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
            >
              {sending
                ? <ActivityIndicator color={colors.neutral[950]} size="small" />
                : <Text style={styles.sendBtnText}>↑</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({
  visible,
  onClose,
  onPosted,
}: {
  visible: boolean;
  onClose: () => void;
  onPosted: () => void;
}) {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getOutfits({ page: 1, pageSize: 20, saved: true })
      .then((res) => {
        if (res.data.length === 0) return getOutfits({ page: 1, pageSize: 20 });
        return res;
      })
      .then((res) => setOutfits(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible]);

  async function handlePost() {
    if (!selected) return;
    setPosting(true);
    try {
      await createPost({ outfitId: selected, caption: caption.trim() || undefined });
      setSelected(null);
      setCaption('');
      onPosted();
      onClose();
    } catch {
      Alert.alert('Erreur', 'Impossible de publier. Réessaie.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.sheetBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, styles.shareSheet]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>PARTAGER UNE TENUE</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.shareScroll}>
            <Text style={styles.shareLabel}>CHOISIR UNE TENUE</Text>
            {loading ? (
              <ActivityIndicator color={colors.primary[400]} style={{ marginVertical: spacing[6] }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.outfitSelector}>
                {outfits.map((outfit) => (
                  <TouchableOpacity
                    key={outfit.id}
                    style={[styles.outfitThumb, selected === outfit.id && styles.outfitThumbSelected]}
                    onPress={() => setSelected(outfit.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.outfitThumbItems}>
                      {outfit.items.slice(0, 3).map((item) => (
                        <View key={item.id} style={styles.outfitThumbItem}>
                          {item.imageUrl ? (
                            <Image source={{ uri: item.imageUrl }} style={styles.outfitThumbItemImg} contentFit="cover" />
                          ) : (
                            <View style={styles.outfitThumbItemPlaceholder}>
                              <Text style={{ color: colors.neutral[700], fontSize: 10 }}>◈</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                    <Text style={styles.outfitThumbScore}>
                      {Math.round(outfit.score * 100)}%
                    </Text>
                    {selected === outfit.id && (
                      <View style={styles.outfitThumbCheck}>
                        <Text style={styles.outfitThumbCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={[styles.shareLabel, { marginTop: spacing[5] }]}>
              CAPTION <Text style={styles.optional}>(optionnel)</Text>
            </Text>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Décris cette tenue…"
              placeholderTextColor={colors.neutral[700]}
              multiline
              maxLength={500}
              keyboardAppearance="dark"
            />
            <View style={styles.captionLine} />
          </ScrollView>

          <TouchableOpacity
            style={[styles.postBtn, (!selected || posting) && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={!selected || posting}
          >
            {posting
              ? <ActivityIndicator color={colors.neutral[950]} />
              : <Text style={styles.postBtnText}>PUBLIER</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}j`;
  return `${Math.floor(d / 7)}sem`;
}

export default function SocialScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('feed');
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [feedCursor, setFeedCursor] = useState<string | null>(null);
  const [exploreCursor, setExploreCursor] = useState<string | null>(null);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [exploreHasMore, setExploreHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [showShare, setShowShare] = useState(false);

  const posts = tab === 'feed' ? feedPosts : explorePosts;
  const hasMore = tab === 'feed' ? feedHasMore : exploreHasMore;
  const cursor = tab === 'feed' ? feedCursor : exploreCursor;

  const load = useCallback(async (reset = false) => {
    const currentCursor = reset ? undefined : (cursor ?? undefined);
    if (!reset && !hasMore) return;
    try {
      const res = tab === 'feed'
        ? await getFeed(currentCursor)
        : await getExplore(currentCursor);

      if (tab === 'feed') {
        setFeedPosts((prev) => reset ? res.data : [...prev, ...res.data]);
        setFeedHasMore(res.hasMore);
        setFeedCursor(res.nextCursor);
      } else {
        setExplorePosts((prev) => reset ? res.data : [...prev, ...res.data]);
        setExploreHasMore(res.hasMore);
        setExploreCursor(res.nextCursor);
      }
    } catch {
      // silent
    }
  }, [tab, cursor, hasMore]);

  useEffect(() => {
    setLoading(true);
    load(true).finally(() => setLoading(false));
  }, [tab]);

  function handleLike(postId: string) {
    const updater = (prev: Post[]) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
        };
      });
    if (tab === 'feed') setFeedPosts(updater);
    else setExplorePosts(updater);
    toggleLike(postId)
      .then((result) => {
        // Sync with server-confirmed values
        const confirmed = (prev: Post[]) =>
          prev.map((p) =>
            p.id === postId ? { ...p, isLiked: result.liked, likesCount: result.likesCount } : p,
          );
        if (tab === 'feed') setFeedPosts(confirmed);
        else setExplorePosts(confirmed);
      })
      .catch(() => {
        // Revert optimistic update on error
        const revert = (prev: Post[]) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
              : p,
          );
        if (tab === 'feed') setFeedPosts(revert);
        else setExplorePosts(revert);
      });
  }

  function handleDelete(postId: string) {
    const remove = (prev: Post[]) => prev.filter((p) => p.id !== postId);
    setFeedPosts(remove);
    setExplorePosts(remove);
    deletePost(postId).catch(() => {
      Alert.alert('Erreur', 'Impossible de supprimer.');
    });
  }

  function handleCommentCountUpdate(postId: string) {
    const updater = (prev: Post[]) =>
      prev.map((p) => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p);
    setFeedPosts(updater);
    setExplorePosts(updater);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>COMMUNAUTÉ</Text>
          <Text style={styles.title}>STYLE FEED</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={() => setShowShare(true)} activeOpacity={0.85}>
          <Text style={styles.shareBtnText}>+ PARTAGER</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['feed', 'explore'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'feed' ? 'MON FEED' : 'EXPLORER'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && posts.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary[400]} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          onEndReached={() => void load()}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load(true);
                setRefreshing(false);
              }}
              tintColor={colors.primary[400]}
            />
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={user?.id ?? ''}
              onLike={handleLike}
              onComment={(p) => setCommentPost(p)}
              onDelete={handleDelete}
              onAuthorPress={(userId) => router.push(`/(app)/social/user/${userId}` as never)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyAccent}>—</Text>
              <Text style={styles.emptyTitle}>
                {tab === 'feed' ? 'Ton feed est vide' : 'Aucun post pour l\'instant'}
              </Text>
              <Text style={styles.emptySub}>
                {tab === 'feed'
                  ? 'Suis des stylistes ou partage ta première tenue.'
                  : 'Sois le premier à partager une tenue !'}
              </Text>
            </View>
          }
          ListFooterComponent={
            hasMore && posts.length > 0 ? (
              <ActivityIndicator color={colors.primary[400]} style={{ marginVertical: spacing[6] }} />
            ) : null
          }
        />
      )}

      <CommentSheet
        post={commentPost}
        currentUserId={user?.id ?? ''}
        visible={!!commentPost}
        onClose={() => setCommentPost(null)}
      />

      <ShareModal
        visible={showShare}
        onClose={() => setShowShare(false)}
        onPosted={() => load(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
  },
  shareBtn: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 9999,
  },
  shareBtnText: {
    color: colors.neutral[950],
    fontSize: 9,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 2,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary[400],
  },
  tabLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 2.5,
    fontWeight: typography.fontWeight.black,
  },
  tabLabelActive: { color: colors.primary[400] },

  // List
  list: { paddingVertical: spacing[2] },

  // Post Card
  card: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[700],
    overflow: 'hidden',
  },
  avatarImage: { width: 36, height: 36 },
  avatarInitials: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  authorName: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[200],
    fontWeight: typography.fontWeight.semibold,
  },
  postTime: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[700],
    marginTop: 1,
  },
  moreBtn: { padding: spacing[2] },
  moreBtnText: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[600],
    letterSpacing: 2,
  },

  // Items strip
  itemsStrip: {
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  itemThumb: {
    width: 80,
    height: 100,
    backgroundColor: colors.neutral[900],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[800],
    borderRadius: 8,
  },
  itemThumbImage: { width: 80, height: 100 },
  itemThumbPlaceholder: {
    width: 80,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemThumbIcon: { fontSize: 20, color: colors.neutral[700] },

  outfitJustif: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    fontStyle: 'italic',
    lineHeight: 18,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[300],
    lineHeight: 20,
  },
  scoreBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    backgroundColor: 'rgba(36,72,216,0.08)',
    borderWidth: 1,
    borderColor: colors.primary[900],
  },
  scoreBadgeText: {
    fontSize: 8,
    color: colors.primary[600],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.black,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: spacing[5],
    paddingTop: spacing[1],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  actionIcon: {
    fontSize: 18,
    color: colors.neutral[600],
  },
  actionIconLiked: { color: colors.primary[400] },
  actionCount: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontWeight: typography.fontWeight.medium,
  },
  actionCountLiked: { color: colors.primary[400] },

  // Comment Sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    backgroundColor: colors.neutral[950],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
    maxHeight: '75%',
    paddingBottom: spacing[6],
  },
  shareSheet: { maxHeight: '85%' },
  sheetHandle: {
    width: 32,
    height: 3,
    backgroundColor: colors.neutral[800],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  sheetTitle: {
    fontSize: 9,
    color: colors.neutral[400],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
  },
  sheetClose: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
  },
  commentList: { maxHeight: 320 },
  noComments: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
    textAlign: 'center',
    paddingVertical: spacing[8],
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 9,
    color: colors.neutral[400],
    fontWeight: typography.fontWeight.bold,
  },
  commentBubble: { flex: 1, gap: 3 },
  commentAuthor: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[300],
    fontWeight: typography.fontWeight.semibold,
  },
  commentContent: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 9,
    color: colors.neutral[700],
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[900],
  },
  commentInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[0],
    paddingVertical: spacing[3],
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.neutral[800] },
  sendBtnText: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[950],
    fontWeight: typography.fontWeight.black,
  },

  // Share Modal
  shareScroll: { maxHeight: 400, paddingHorizontal: spacing[5] },
  shareLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
    marginTop: spacing[4],
    marginBottom: spacing[3],
  },
  optional: {
    color: colors.neutral[800],
    letterSpacing: 0,
    fontWeight: typography.fontWeight.regular,
  },
  outfitSelector: { gap: spacing[3], paddingBottom: spacing[2] },
  outfitThumb: {
    width: 100,
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    padding: spacing[2],
    gap: spacing[2],
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  outfitThumbSelected: {
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(36,72,216,0.06)',
  },
  outfitThumbItems: { flexDirection: 'row', gap: 3 },
  outfitThumbItem: { flex: 1, height: 60, backgroundColor: colors.neutral[800] },
  outfitThumbItemImg: { width: '100%', height: '100%' },
  outfitThumbItemPlaceholder: {
    flex: 1,
    height: 60,
    backgroundColor: colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  outfitThumbScore: {
    fontSize: 8,
    color: colors.neutral[600],
    letterSpacing: 1,
    fontWeight: typography.fontWeight.medium,
  },
  outfitThumbCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  outfitThumbCheckText: {
    fontSize: 10,
    color: colors.neutral[950],
    fontWeight: typography.fontWeight.black,
  },
  captionInput: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[0],
    paddingVertical: spacing[2],
    minHeight: 60,
  },
  captionLine: {
    height: 1,
    backgroundColor: colors.neutral[800],
    marginBottom: spacing[4],
  },
  postBtn: {
    backgroundColor: colors.primary[500],
    marginHorizontal: spacing[5],
    marginTop: spacing[3],
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 9999,
  },
  postBtnDisabled: { backgroundColor: colors.neutral[800] },
  postBtnText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },

  // Empty state
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: spacing[20], gap: spacing[3] },
  emptyAccent: {
    fontSize: 48,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[800],
    letterSpacing: 2,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[400],
  },
  emptySub: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing[8],
  },
});

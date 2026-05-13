import { colors, typography, spacing } from '@outfit-now/design-tokens';
import type { Post, Outfit, Comment } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
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

import { useAppTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../hooks/useAuth';
import { getOutfits } from '../../../lib/briefs';
import {
  getFeed,
  getExplore,
  toggleLike,
  addComment,
  getComments,
  deletePost,
  createPost,
} from '../../../lib/social';

type Tab = 'feed' | 'explore';

// ── Mock seed data for Explorer ───────────────────────────────────────────────

const MOCK_EXPLORE_POSTS: Post[] = [
  {
    id: 'mock-1',
    author: {
      id: 'mock-u1',
      firstName: 'Léa',
      lastName: 'Martin',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    },
    caption:
      'Airport edit minimaliste — blanc optique + denim délavé. Confort et style au départ ✈️',
    outfit: {
      id: 'mock-o1',
      justification:
        'Palette tricolore blanc/bleu/noir à contraste maximal. Le blanc ancre, le denim apporte la texture.',
      score: 0.83,
      items: [
        {
          id: 'mock-i1a',
          imageUrl:
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80',
          category: 'top',
        },
        {
          id: 'mock-i1b',
          imageUrl:
            'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=300&q=80',
          category: 'bottom',
        },
        {
          id: 'mock-i1c',
          imageUrl:
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
          category: 'shoes',
        },
      ],
    },
    likesCount: 34,
    commentsCount: 7,
    isLiked: false,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'mock-2',
    author: {
      id: 'mock-u2',
      firstName: 'Camille',
      lastName: 'Dubois',
      avatarUrl:
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=80&q=80',
    },
    caption: 'Soirée rooftop 🌆 La robe noire ne trahit jamais.',
    outfit: {
      id: 'mock-o2',
      justification:
        'Silhouette minimaliste soirée : robe fourreau noire, escarpins nude, clutch dorée.',
      score: 0.91,
      items: [
        {
          id: 'mock-i2a',
          imageUrl:
            'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=300&q=80',
          category: 'dress',
        },
        {
          id: 'mock-i2b',
          imageUrl:
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=300&q=80',
          category: 'shoes',
        },
      ],
    },
    likesCount: 91,
    commentsCount: 18,
    isLiked: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'mock-3',
    author: {
      id: 'mock-u3',
      firstName: 'Thomas',
      lastName: 'Renard',
      avatarUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80',
    },
    caption: 'Business casual vendredi. Le blazer beige change tout 🤝',
    outfit: {
      id: 'mock-o3',
      justification:
        'Blazer structuré beige sur t-shirt blanc et chino marine — autorité sans rigidité.',
      score: 0.87,
      items: [
        {
          id: 'mock-i3a',
          imageUrl:
            'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80',
          category: 'top',
        },
        {
          id: 'mock-i3b',
          imageUrl:
            'https://images.unsplash.com/photo-1624378515195-4ab9e0e8e5d3?auto=format&fit=crop&w=300&q=80',
          category: 'bottom',
        },
        {
          id: 'mock-i3c',
          imageUrl:
            'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=300&q=80',
          category: 'shoes',
        },
      ],
    },
    likesCount: 56,
    commentsCount: 11,
    isLiked: false,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'mock-4',
    author: {
      id: 'mock-u4',
      firstName: 'Sofia',
      lastName: 'Petit',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
    },
    caption: 'Weekend market vibes 🧺 Couleurs douces, matières naturelles.',
    outfit: {
      id: 'mock-o4',
      justification:
        'Look marché dominical : linen top ivoire, jupe midi terracotta, sandales tressées.',
      score: 0.79,
      items: [
        {
          id: 'mock-i4a',
          imageUrl:
            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80',
          category: 'top',
        },
        {
          id: 'mock-i4b',
          imageUrl:
            'https://images.unsplash.com/photo-1515372683344-06f929e91a2b?auto=format&fit=crop&w=300&q=80',
          category: 'bottom',
        },
      ],
    },
    likesCount: 47,
    commentsCount: 9,
    isLiked: false,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'mock-5',
    author: {
      id: 'mock-u5',
      firstName: 'Julien',
      lastName: 'Bernard',
      avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',
    },
    caption: 'Run club samedi matin ☀️ Performance + style, les deux.',
    outfit: {
      id: 'mock-o5',
      justification:
        'Ensemble sport technique : t-shirt compression, short running, baskets boost.',
      score: 0.88,
      items: [
        {
          id: 'mock-i5a',
          imageUrl:
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=300&q=80',
          category: 'top',
        },
        {
          id: 'mock-i5b',
          imageUrl:
            'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80',
          category: 'shoes',
        },
      ],
    },
    likesCount: 29,
    commentsCount: 4,
    isLiked: false,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'mock-6',
    author: {
      id: 'mock-u6',
      firstName: 'Inès',
      lastName: 'Laurent',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80',
    },
    caption: 'Street style Paris — oversize coat saison 🍂',
    outfit: {
      id: 'mock-o6',
      justification:
        'Manteau oversize camel sur total look noir : jeans slim, bottines, sac baguette.',
      score: 0.93,
      items: [
        {
          id: 'mock-i6a',
          imageUrl:
            'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=300&q=80',
          category: 'outerwear',
        },
        {
          id: 'mock-i6b',
          imageUrl:
            'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=300&q=80',
          category: 'bottom',
        },
        {
          id: 'mock-i6c',
          imageUrl:
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=300&q=80',
          category: 'shoes',
        },
      ],
    },
    likesCount: 112,
    commentsCount: 23,
    isLiked: false,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

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
  const theme = useAppTheme();
  const isOwner = post.author.id === currentUserId;
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <View style={[styles.card, { borderBottomColor: theme.colors.surface }]}>
      {/* Author row */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => onAuthorPress(post.author.id)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
            ]}
          >
            {post.author.avatarUrl ? (
              <Image
                source={{ uri: post.author.avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={[styles.avatarInitials, { color: theme.colors.textMuted }]}>
                {post.author.firstName[0]}
                {post.author.lastName[0]}
              </Text>
            )}
          </View>
          <View>
            <Text style={[styles.authorName, { color: theme.colors.textSecondary }]}>
              {post.author.firstName} {post.author.lastName}
            </Text>
            <Text style={[styles.postTime, { color: theme.colors.textMuted }]}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Supprimer', 'Supprimer ce post ?', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(post.id) },
              ])
            }
            style={styles.moreBtn}
          >
            <Text style={[styles.moreBtnText, { color: theme.colors.textMuted }]}>···</Text>
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
            <View
              key={item.id}
              style={[
                styles.itemThumb,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceAlt },
              ]}
            >
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemThumbImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.itemThumbPlaceholder}>
                  <Text style={[styles.itemThumbIcon, { color: theme.colors.border }]}>◈</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Outfit justification */}
      {post.outfit?.justification ? (
        <Text style={[styles.outfitJustif, { color: theme.colors.textMuted }]} numberOfLines={2}>
          {post.outfit.justification}
        </Text>
      ) : null}

      {/* Caption */}
      {post.caption ? (
        <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>{post.caption}</Text>
      ) : null}

      {/* Score badge */}
      {post.outfit && (
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeText}>SCORE {Math.round(post.outfit.score * 100)}%</Text>
        </View>
      )}

      {/* Actions row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onLike(post.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.actionIcon,
              { color: theme.colors.textMuted },
              post.isLiked && styles.actionIconLiked,
            ]}
          >
            {post.isLiked ? '♥' : '♡'}
          </Text>
          <Text
            style={[
              styles.actionCount,
              { color: theme.colors.textMuted },
              post.isLiked && styles.actionCountLiked,
            ]}
          >
            {post.likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onComment(post)}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionIcon, { color: theme.colors.textMuted }]}>◎</Text>
          <Text style={[styles.actionCount, { color: theme.colors.textMuted }]}>
            {post.commentsCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Comment Sheet ────────────────────────────────────────────────────────────

function CommentSheet({
  post,
  currentUserId: _currentUserId,
  visible,
  onClose,
}: {
  post: Post | null;
  currentUserId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useAppTheme();
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
      Alert.alert('Erreur', "Impossible d'envoyer le commentaire.");
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
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.background, borderTopColor: theme.colors.surfaceAlt },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: theme.colors.surfaceAlt }]} />
          <View style={[styles.sheetHeader, { borderBottomColor: theme.colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: theme.colors.textMuted }]}>COMMENTAIRES</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.sheetClose, { color: theme.colors.textMuted }]}>✕</Text>
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
                <Text style={[styles.noComments, { color: theme.colors.border }]}>
                  Sois le premier à commenter.
                </Text>
              }
              renderItem={({ item: c }) => (
                <View style={[styles.commentRow, { borderBottomColor: theme.colors.surface }]}>
                  <View
                    style={[styles.commentAvatar, { backgroundColor: theme.colors.surfaceAlt }]}
                  >
                    <Text style={[styles.commentAvatarText, { color: theme.colors.textMuted }]}>
                      {c.author.firstName[0]}
                      {c.author.lastName[0]}
                    </Text>
                  </View>
                  <View style={styles.commentBubble}>
                    <Text style={[styles.commentAuthor, { color: theme.colors.textSecondary }]}>
                      {c.author.firstName} {c.author.lastName}
                    </Text>
                    <Text style={[styles.commentContent, { color: theme.colors.textMuted }]}>
                      {c.content}
                    </Text>
                    <Text style={[styles.commentTime, { color: theme.colors.border }]}>
                      {getTimeAgo(c.createdAt)}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}

          <View style={[styles.commentInputRow, { borderTopColor: theme.colors.surface }]}>
            <TextInput
              style={[styles.commentInput, { color: theme.colors.textPrimary }]}
              value={input}
              onChangeText={setInput}
              placeholder="Ajouter un commentaire…"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={500}
              keyboardAppearance="dark"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color={theme.colors.background} size="small" />
              ) : (
                <Text style={[styles.sendBtnText, { color: theme.colors.background }]}>↑</Text>
              )}
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
  const theme = useAppTheme();
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
        <View
          style={[
            styles.sheet,
            styles.shareSheet,
            { backgroundColor: theme.colors.background, borderTopColor: theme.colors.surfaceAlt },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: theme.colors.surfaceAlt }]} />
          <View style={[styles.sheetHeader, { borderBottomColor: theme.colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: theme.colors.textMuted }]}>
              PARTAGER UNE TENUE
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.sheetClose, { color: theme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.shareScroll}>
            <Text style={[styles.shareLabel, { color: theme.colors.textMuted }]}>
              CHOISIR UNE TENUE
            </Text>
            {loading ? (
              <ActivityIndicator
                color={colors.primary[400]}
                style={{ marginVertical: spacing[6] }}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.outfitSelector}
              >
                {outfits.map((outfit) => (
                  <TouchableOpacity
                    key={outfit.id}
                    style={[
                      styles.outfitThumb,
                      {
                        borderColor: theme.colors.surfaceAlt,
                        backgroundColor: theme.colors.surface,
                      },
                      selected === outfit.id && styles.outfitThumbSelected,
                    ]}
                    onPress={() => setSelected(outfit.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.outfitThumbItems}>
                      {outfit.items.slice(0, 3).map((item) => (
                        <View
                          key={item.id}
                          style={[
                            styles.outfitThumbItem,
                            { backgroundColor: theme.colors.surfaceAlt },
                          ]}
                        >
                          {item.imageUrl ? (
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={styles.outfitThumbItemImg}
                              contentFit="cover"
                            />
                          ) : (
                            <View
                              style={[
                                styles.outfitThumbItemPlaceholder,
                                { backgroundColor: theme.colors.surfaceAlt },
                              ]}
                            >
                              <Text style={{ color: theme.colors.border, fontSize: 10 }}>◈</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.outfitThumbScore, { color: theme.colors.textMuted }]}>
                      {Math.round(outfit.score * 100)}%
                    </Text>
                    {selected === outfit.id && (
                      <View style={styles.outfitThumbCheck}>
                        <Text
                          style={[styles.outfitThumbCheckText, { color: theme.colors.background }]}
                        >
                          ✓
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text
              style={[styles.shareLabel, { marginTop: spacing[5], color: theme.colors.textMuted }]}
            >
              CAPTION{' '}
              <Text style={[styles.optional, { color: theme.colors.surfaceAlt }]}>(optionnel)</Text>
            </Text>
            <TextInput
              style={[styles.captionInput, { color: theme.colors.textPrimary }]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Décris cette tenue…"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={500}
              keyboardAppearance="dark"
            />
            <View style={[styles.captionLine, { backgroundColor: theme.colors.surfaceAlt }]} />
          </ScrollView>

          <TouchableOpacity
            style={[styles.postBtn, (!selected || posting) && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={!selected || posting}
          >
            {posting ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <Text style={[styles.postBtnText, { color: theme.colors.background }]}>PUBLIER</Text>
            )}
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
  const theme = useAppTheme();
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

  const rawPosts = tab === 'feed' ? feedPosts : explorePosts;
  const posts =
    tab === 'explore' && rawPosts.length === 0 && !loading ? MOCK_EXPLORE_POSTS : rawPosts;
  const hasMore = tab === 'feed' ? feedHasMore : exploreHasMore;
  const cursor = tab === 'feed' ? feedCursor : exploreCursor;

  const load = useCallback(
    async (reset = false) => {
      const currentCursor = reset ? undefined : (cursor ?? undefined);
      if (!reset && !hasMore) return;
      try {
        const res = tab === 'feed' ? await getFeed(currentCursor) : await getExplore(currentCursor);

        if (tab === 'feed') {
          setFeedPosts((prev) => (reset ? res.data : [...prev, ...res.data]));
          setFeedHasMore(res.hasMore);
          setFeedCursor(res.nextCursor);
        } else {
          setExplorePosts((prev) => (reset ? res.data : [...prev, ...res.data]));
          setExploreHasMore(res.hasMore);
          setExploreCursor(res.nextCursor);
        }
      } catch {
        // silent
      }
    },
    [tab, cursor, hasMore],
  );

  useEffect(() => {
    setLoading(true);
    void load(true).finally(() => setLoading(false));
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
    if (postId.startsWith('mock-')) {
      // local-only like for mock posts
      const mockIdx = MOCK_EXPLORE_POSTS.findIndex((p) => p.id === postId);
      if (mockIdx !== -1) {
        const p = MOCK_EXPLORE_POSTS[mockIdx];
        MOCK_EXPLORE_POSTS[mockIdx] = {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
        };
      }
      return;
    }
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
              ? {
                  ...p,
                  isLiked: !p.isLiked,
                  likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
                }
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.colors.statusBar} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.surface }]}>
        <View>
          <Text style={styles.eyebrow}>COMMUNAUTÉ</Text>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>STYLE FEED</Text>
        </View>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => setShowShare(true)}
          activeOpacity={0.85}
        >
          <Text style={[styles.shareBtnText, { color: theme.colors.background }]}>+ PARTAGER</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: theme.colors.surface }]}>
        {(['feed', 'explore'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: theme.colors.textMuted },
                tab === t && styles.tabLabelActive,
              ]}
            >
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
              <Text style={[styles.emptyAccent, { color: theme.colors.surfaceAlt }]}>—</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.textMuted }]}>
                {tab === 'feed' ? 'Ton feed est vide' : "Aucun post pour l'instant"}
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.border }]}>
                {tab === 'feed'
                  ? 'Suis des stylistes ou partage ta première tenue.'
                  : 'Sois le premier à partager une tenue !'}
              </Text>
            </View>
          }
          ListFooterComponent={
            hasMore && posts.length > 0 ? (
              <ActivityIndicator
                color={colors.primary[400]}
                style={{ marginVertical: spacing[6] }}
              />
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
    backgroundColor: 'rgba(0,196,191,0.08)',
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
    backgroundColor: 'rgba(0,196,191,0.06)',
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

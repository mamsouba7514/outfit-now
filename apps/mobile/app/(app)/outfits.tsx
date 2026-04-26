import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@outfit-now/design-tokens';
import type { Outfit, ShoppingResult } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
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
  Modal,
  ScrollView as HScrollView,
} from 'react-native';

import { getOutfits, outfitAction } from '../../lib/briefs';
import { requestTryOn } from '../../lib/avatar';

// ─── Shopping card ────────────────────────────────────────────────────────────

function ShoppingCard({ product }: { product: ShoppingResult }) {
  return (
    <TouchableOpacity
      style={shopStyles.card}
      onPress={() => void Linking.openURL(product.link)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: product.imageUrl }} style={shopStyles.img} contentFit="cover" />
      <View style={shopStyles.info}>
        <Text style={shopStyles.title} numberOfLines={2}>{product.title}</Text>
        <Text style={shopStyles.store} numberOfLines={1}>{product.store}</Text>
        <Text style={shopStyles.price}>{product.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

const shopStyles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[700],
    marginRight: spacing[3],
    overflow: 'hidden',
  },
  img: { width: '100%', height: 120 },
  info: {
    padding: spacing[2],
    gap: 3,
  },
  title: {
    fontSize: 10,
    color: colors.neutral[200],
    lineHeight: 13,
    fontWeight: typography.fontWeight.medium,
  },
  store: { fontSize: 9, color: colors.neutral[600], letterSpacing: 0.5 },
  price: {
    fontSize: 11,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'saved' | 'worn';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'TOUTES', value: 'all' },
  { label: 'SAUVÉES', value: 'saved' },
  { label: 'PORTÉES', value: 'worn' },
];

const CATEGORY_FR: Record<string, string> = {
  tops: 'Hauts', bottoms: 'Bas', dresses: 'Robes', outerwear: 'Manteaux',
  shoes: 'Chaussures', bags: 'Sacs', accessories: 'Accessoires',
  activewear: 'Sport', underwear: 'Sous-vêtements', other: 'Autre',
};

export default function OutfitsScreen() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Try-on modal
  const [tryonOutfit, setTryonOutfit] = useState<Outfit | null>(null);
  const [tryonLoading, setTryonLoading] = useState(false);
  const [tryonResult, setTryonResult] = useState<{ status: string; message?: string; resultUrl?: string } | null>(null);

  const load = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (!reset && !hasMore) return;

    try {
      const params: { page: number; pageSize: number; saved?: boolean } = {
        page: currentPage,
        pageSize: 20,
      };
      if (filter === 'saved') params.saved = true;

      const res = await getOutfits(params);

      const filtered = filter === 'worn'
        ? res.data.filter((o) => o.wornAt !== null)
        : res.data;

      setOutfits((prev) => reset ? filtered : [...prev, ...filtered]);
      setHasMore(res.hasMore);
      setPage(currentPage + 1);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, hasMore, filter]);

  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    setHasMore(true);
    void load(true);
  }, [filter]);

  async function handleTryon(outfit: Outfit) {
    setTryonOutfit(outfit);
    setTryonResult(null);
    setTryonLoading(true);
    try {
      const result = await requestTryOn(outfit.id);
      setTryonResult(result);
    } catch {
      setTryonResult({ status: 'error', message: 'Impossible de lancer l\'essayage.' });
    } finally {
      setTryonLoading(false);
    }
  }

  async function handleAction(outfit: Outfit, action: 'save' | 'discard') {
    try {
      await outfitAction(outfit.id, action);
      if (action === 'discard') {
        setOutfits((prev) => prev.filter((o) => o.id !== outfit.id));
      } else {
        setOutfits((prev) =>
          prev.map((o) => o.id === outfit.id ? { ...o, savedAt: new Date().toISOString() } : o),
        );
      }
    } catch {
      Alert.alert('Erreur', 'Action impossible. Réessaie.');
    }
  }

  function renderItem({ item }: { item: Outfit }) {
    const isSaved = item.savedAt !== null;
    const isWorn = item.wornAt !== null;
    const isDiscarded = item.discardedAt !== null;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreValue}>{Math.round(item.score * 100)}</Text>
            <Text style={styles.scoreUnit}>%</Text>
          </View>
          <View style={styles.badges}>
            {isSaved && (
              <View style={styles.badgeSaved}>
                <Text style={styles.badgeSavedText}>SAUVÉE</Text>
              </View>
            )}
            {isWorn && (
              <View style={styles.badgeWorn}>
                <Text style={styles.badgeWornText}>PORTÉE</Text>
              </View>
            )}
            {isDiscarded && (
              <View style={styles.badgeDiscard}>
                <Text style={styles.badgeDiscardText}>REJETÉE</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.justif} numberOfLines={2}>{item.justification}</Text>

        <View style={styles.piecesRow}>
          {item.items.slice(0, 4).map((piece) => (
            <View key={piece.id} style={styles.pieceTag}>
              <Text style={styles.pieceTagText}>
                {(CATEGORY_FR[piece.category] ?? piece.category ?? 'autre').toUpperCase()}
              </Text>
            </View>
          ))}
          {item.items.length > 4 && (
            <View style={styles.pieceTag}>
              <Text style={styles.pieceTagText}>+{item.items.length - 4}</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>

        {/* Shopping suggestions */}
        {(item.shoppingResults?.length ?? 0) > 0 && (
          <View style={styles.shoppingSection}>
            <View style={styles.shoppingSectionHeader}>
              <Ionicons name="bag-outline" size={11} color={colors.primary[500]} />
              <Text style={styles.shoppingSectionLabel}>SUGGESTIONS SHOPPING</Text>
            </View>
            <HScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shoppingScroll}>
              {(item.shoppingResults ?? []).map((prod, idx) => (
                <ShoppingCard key={idx} product={prod} />
              ))}
            </HScrollView>
          </View>
        )}

        {/* Try-on button — always visible on non-discarded */}
        {!isDiscarded && (
          <TouchableOpacity
            style={styles.btnTryon}
            onPress={() => void handleTryon(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="shirt-outline" size={13} color={colors.primary[400]} />
            <Text style={styles.btnTryonText}>ESSAYER SUR MON MANNEQUIN</Text>
          </TouchableOpacity>
        )}

        {!isDiscarded && !isWorn && (
          <View style={styles.actions}>
            {!isSaved && (
              <TouchableOpacity
                style={styles.btnSave}
                onPress={() => handleAction(item, 'save')}
              >
                <Text style={styles.btnSaveText}>SAUVEGARDER</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.btnDiscard}
              onPress={() => handleAction(item, 'discard')}
            >
              <Text style={styles.btnDiscardText}>REJETER</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MES</Text>
        <Text style={styles.title}>TENUES</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterLabel, filter === f.value && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary[400]} />
        </View>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={() => void load()}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                void load(true);
              }}
              tintColor={colors.primary[400]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyAccent}>0</Text>
              <Text style={styles.emptyTitle}>Aucune tenue</Text>
              <Text style={styles.emptySub}>Compose ta première tenue avec le Styliste IA.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(app)/stylist' as never)}
              >
                <Text style={styles.emptyBtnText}>CRÉER UNE TENUE</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            hasMore && outfits.length > 0 ? (
              <ActivityIndicator style={{ marginVertical: spacing[6] }} color={colors.primary[400]} />
            ) : null
          }
        />
      )}

      {/* ── Try-on Modal ─────────────────────────────────────────── */}
      <Modal
        visible={tryonOutfit !== null}
        animationType="slide"
        transparent
        onRequestClose={() => { setTryonOutfit(null); setTryonResult(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>ESSAYAGE VIRTUEL</Text>
                <Text style={styles.modalTitle}>Mon Mannequin</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setTryonOutfit(null); setTryonResult(null); }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color={colors.neutral[400]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            {tryonLoading ? (
              <View style={styles.modalBody}>
                <ActivityIndicator size="large" color={colors.primary[400]} />
                <Text style={styles.modalStateText}>Analyse de la tenue…</Text>
              </View>
            ) : tryonResult?.status === 'completed' && tryonResult.resultUrl ? (
              /* Résultat réel (quand Fashn.ai est branché) */
              <View style={styles.modalBody}>
                <Text style={styles.modalStateText}>Essayage terminé ✓</Text>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <View style={styles.tryonIconWrap}>
                  <Ionicons name="shirt-outline" size={48} color={colors.primary[600]} />
                </View>
                <Text style={styles.modalStateTitle}>Bientôt disponible</Text>
                <Text style={styles.modalStateDesc}>
                  L'essayage virtuel IA est en cours de déploiement. Tu pourras visualiser cette tenue sur ton mannequin personnel dès son lancement.
                </Text>
                <TouchableOpacity
                  style={styles.modalAvatarBtn}
                  onPress={() => {
                    setTryonOutfit(null);
                    setTryonResult(null);
                    router.push('/(app)/avatar' as never);
                  }}
                >
                  <Text style={styles.modalAvatarBtnText}>CONFIGURER MON MANNEQUIN →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  header: {
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
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  filterBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  filterBtnActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.medium,
  },
  filterLabelActive: { color: colors.neutral[950] },
  list: { padding: spacing[6], gap: spacing[4] },
  card: {
    backgroundColor: colors.neutral[900],
    padding: spacing[5],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  scoreValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.primary[400],
  },
  scoreUnit: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  badges: { flexDirection: 'row', gap: spacing[2] },
  badgeSaved: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    backgroundColor: 'rgba(196,154,46,0.15)',
    borderWidth: 1,
    borderColor: colors.primary[700],
  },
  badgeSavedText: {
    fontSize: 9,
    color: colors.primary[400],
    letterSpacing: 1,
    fontWeight: typography.fontWeight.black,
  },
  badgeWorn: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: '#166534',
  },
  badgeWornText: {
    fontSize: 9,
    color: '#22c55e',
    letterSpacing: 1,
    fontWeight: typography.fontWeight.black,
  },
  badgeDiscard: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    backgroundColor: colors.neutral[800],
  },
  badgeDiscardText: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 1,
    fontWeight: typography.fontWeight.medium,
  },
  justif: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    lineHeight: 20,
  },
  piecesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1] },
  pieceTag: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    backgroundColor: colors.neutral[800],
  },
  pieceTagText: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 1,
    fontWeight: typography.fontWeight.medium,
  },
  cardDate: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[700],
    letterSpacing: 0.5,
  },
  actions: { flexDirection: 'row', gap: spacing[2] },
  btnSave: {
    flex: 1,
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  btnSaveText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[950],
    letterSpacing: 1.5,
  },
  btnDiscard: {
    flex: 1,
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    alignItems: 'center',
  },
  btnDiscardText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.medium,
  },
  shoppingSection: {
    gap: spacing[2],
  },
  shoppingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  shoppingSectionLabel: {
    fontSize: 9,
    color: colors.primary[500],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },
  shoppingScroll: {
    paddingBottom: spacing[1],
  },
  btnTryon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.primary[800],
    backgroundColor: 'rgba(196,154,46,0.05)',
  },
  btnTryonText: {
    fontSize: 9,
    color: colors.primary[400],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.bold,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.neutral[900],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
    paddingBottom: spacing[10],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
  },
  modalEyebrow: {
    fontSize: 9,
    color: colors.primary[400],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: 1,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.neutral[800],
    marginHorizontal: spacing[6],
  },
  modalBody: {
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    gap: spacing[4],
  },
  tryonIconWrap: {
    width: 96,
    height: 96,
    backgroundColor: colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  modalStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: 1,
    textAlign: 'center',
  },
  modalStateText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    letterSpacing: 0.5,
    marginTop: spacing[4],
  },
  modalStateDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    lineHeight: 20,
    textAlign: 'center',
  },
  modalAvatarBtn: {
    marginTop: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderWidth: 1,
    borderColor: colors.primary[600],
  },
  modalAvatarBtnText: {
    fontSize: 10,
    color: colors.primary[400],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: spacing[20], gap: spacing[3] },
  emptyAccent: {
    fontSize: 80,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[900],
    lineHeight: 80,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[300],
  },
  emptySub: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: spacing[2],
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
  },
  emptyBtnText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 2,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@outfit-now/design-tokens';
import type { Outfit } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
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
  Dimensions,
} from 'react-native';

import { useAppTheme } from '../../contexts/ThemeContext';
import { requestTryOn } from '../../lib/avatar';
import { getOutfits, outfitAction } from '../../lib/briefs';

const WIN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (WIN_WIDTH - spacing[5] * 2 - spacing[3]) / 2;

type TabValue = 'saved' | 'favorites';

const TABS: { label: string; value: TabValue }[] = [
  { label: 'Enregistrés', value: 'saved' },
  { label: 'Favoris', value: 'favorites' },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export default function OutfitsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>('saved');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [tryonOutfit, setTryonOutfit] = useState<Outfit | null>(null);
  const [tryonLoading, setTryonLoading] = useState(false);
  const [tryonResult, setTryonResult] = useState<{
    status: string;
    message?: string;
    resultUrl?: string;
  } | null>(null);

  const load = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 1 : page;
      if (!reset && !hasMore) return;
      try {
        const res = await getOutfits({ page: currentPage, pageSize: 20, saved: true });
        const filtered =
          activeTab === 'favorites' ? res.data.filter((o) => o.wornAt !== null) : res.data;
        setOutfits((prev) => (reset ? filtered : [...prev, ...filtered]));
        setHasMore(res.hasMore);
        setPage(currentPage + 1);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, hasMore, activeTab],
  );

  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    setHasMore(true);
    void load(true);
  }, [activeTab]);

  async function handleTryon(outfit: Outfit) {
    setTryonOutfit(outfit);
    setTryonResult(null);
    setTryonLoading(true);
    try {
      const result = await requestTryOn(outfit.id);
      setTryonResult(result);
    } catch {
      setTryonResult({ status: 'error', message: "Impossible de lancer l'essayage." });
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
          prev.map((o) => (o.id === outfit.id ? { ...o, savedAt: new Date().toISOString() } : o)),
        );
      }
    } catch {
      Alert.alert('Erreur', 'Action impossible. Réessaie.');
    }
  }

  function renderItem({ item, index }: { item: Outfit; index: number }) {
    const isSaved = item.savedAt !== null;
    const isLeft = index % 2 === 0;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          !isLeft && styles.cardRight,
        ]}
      >
        <View style={styles.dateLabelWrap}>
          <Text style={styles.dateLabel}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.cardImageWrap}>
          {item.items[0]?.imageUrl ? (
            <Image
              source={{ uri: item.items[0].imageUrl }}
              style={styles.cardImage}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.cardImage,
                styles.cardImagePlaceholder,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons name="shirt-outline" size={32} color="#dbeafe" />
            </View>
          )}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => handleAction(item, isSaved ? 'discard' : 'save')}
          >
            <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={18} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.tryonBtn, { borderTopColor: theme.colors.border }]}
          onPress={() => void handleTryon(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="shirt-outline" size={11} color="#00C4BF" />
          <Text style={styles.tryonBtnText}>Essayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.colors.statusBar} />

      <View style={styles.headerGradient}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Mes looks</Text>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: theme.colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={styles.tabBtn}
            onPress={() => setActiveTab(tab.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: theme.colors.textMuted },
                activeTab === tab.value && {
                  color: theme.colors.textPrimary,
                  fontFamily: 'Poppins_600SemiBold',
                },
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.value && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#00C4BF" />
        </View>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.grid}
          onEndReached={() => void load()}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                void load(true);
              }}
              tintColor="#00C4BF"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                Aucune tenue
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                Compose ta première tenue avec le Styliste IA.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtnWrap}
                onPress={() => router.push('/(app)/stylist' as never)}
              >
                <View style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>CRÉER UNE TENUE</Text>
                </View>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            hasMore && outfits.length > 0 ? (
              <ActivityIndicator style={{ marginVertical: spacing[6] }} color="#00C4BF" />
            ) : null
          }
        />
      )}

      <Modal
        visible={tryonOutfit !== null}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setTryonOutfit(null);
          setTryonResult(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>ESSAYAGE VIRTUEL</Text>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                  Mon Mannequin
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setTryonOutfit(null);
                  setTryonResult(null);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={[styles.modalDivider, { backgroundColor: theme.colors.border }]} />
            {tryonLoading ? (
              <View style={styles.modalBody}>
                <ActivityIndicator size="large" color="#00C4BF" />
                <Text style={[styles.modalStateText, { color: theme.colors.textMuted }]}>
                  Analyse de la tenue…
                </Text>
              </View>
            ) : tryonResult?.status === 'completed' && tryonResult.resultUrl ? (
              <View style={styles.modalBody}>
                <Text style={[styles.modalStateText, { color: theme.colors.textMuted }]}>
                  Essayage terminé
                </Text>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <View
                  style={[
                    styles.tryonIconWrap,
                    {
                      backgroundColor: theme.dark ? '#1e3a5f' : '#dbeafe',
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Ionicons name="shirt-outline" size={48} color="#00C4BF" />
                </View>
                <Text style={[styles.modalStateTitle, { color: theme.colors.textPrimary }]}>
                  Bientôt disponible
                </Text>
                <Text style={[styles.modalStateDesc, { color: theme.colors.textMuted }]}>
                  L'essayage virtuel IA est en cours de déploiement. Tu pourras visualiser cette
                  tenue sur ton mannequin personnel dès son lancement.
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
  container: { flex: 1 },
  headerGradient: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[16],
    paddingBottom: spacing[3],
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 22 },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[5],
    borderBottomWidth: 1,
    marginBottom: spacing[3],
  },
  tabBtn: { marginRight: spacing[6], paddingBottom: spacing[3], alignItems: 'center' },
  tabLabel: { fontFamily: 'Poppins_500Medium', fontSize: 14 },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#00C4BF',
  },

  grid: { paddingHorizontal: spacing[5], paddingBottom: spacing[20] },

  card: {
    width: CARD_WIDTH,
    marginRight: spacing[3],
    marginBottom: spacing[4],
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRight: { marginRight: 0 },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', aspectRatio: 3 / 4 },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  dateLabelWrap: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    zIndex: 2,
    backgroundColor: 'rgba(13,27,42,0.55)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dateLabel: { fontFamily: 'Poppins_500Medium', fontSize: 9, color: '#FFFFFF' },
  heartBtn: {
    position: 'absolute',
    bottom: spacing[2],
    left: spacing[2],
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing[2],
    borderTopWidth: 1,
  },
  tryonBtnText: { fontFamily: 'Poppins_500Medium', fontSize: 10, color: '#00C4BF' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
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
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#00C4BF',
    letterSpacing: 3,
    marginBottom: 4,
  },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18 },
  modalDivider: { height: 1, marginHorizontal: spacing[6] },
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
    borderRadius: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  modalStateTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, textAlign: 'center' },
  modalStateText: { fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: spacing[4] },
  modalStateDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalAvatarBtn: {
    marginTop: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderWidth: 1,
    borderColor: '#00C4BF',
    borderRadius: 9999,
  },
  modalAvatarBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#00C4BF',
    letterSpacing: 2,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: spacing[20], gap: spacing[3] },
  emptyTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 17 },
  emptySub: { fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyBtnWrap: {
    marginTop: spacing[2],
    borderRadius: 9999,
    overflow: 'hidden',
  },
  emptyBtn: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: 9999,
    backgroundColor: '#00C4BF',
    alignItems: 'center',
  },
  emptyBtnText: { fontFamily: 'Poppins_700Bold', color: '#FFFFFF', fontSize: 12, letterSpacing: 2 },
});

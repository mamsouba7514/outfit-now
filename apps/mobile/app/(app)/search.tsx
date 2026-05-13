import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@outfit-now/design-tokens';
import type { DressingItem } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../../contexts/ThemeContext';
import { getDressingItems } from '../../lib/dressing';
import {
  searchStyle,
  getSearchHistory,
  type SearchProduct,
  type SearchHistoryEntry,
} from '../../lib/search';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing[5] * 2 - 12) / 2;

type MarketTab = 'buy' | 'sell';

const CATEGORIES = [
  { label: 'Tout', value: undefined },
  { label: 'Hauts', value: 'tops' },
  { label: 'Bas', value: 'bottoms' },
  { label: 'Robes', value: 'dresses' },
  { label: 'Manteaux', value: 'outerwear' },
  { label: 'Chaussures', value: 'shoes' },
  { label: 'Sacs', value: 'bags' },
  { label: 'Accessoires', value: 'accessories' },
];

const TIERS = [
  { label: 'Standard', icon: '🛍️', maxPrice: 100, minPrice: undefined, desc: "Jusqu'à 100 €" },
  { label: 'Premium', icon: '✦', maxPrice: 500, minPrice: 100, desc: '100 – 500 €' },
  { label: 'Luxe', icon: '♛', maxPrice: undefined, minPrice: 500, desc: '500 € et plus' },
];

const SUGGESTIONS = [
  'blazer oversize camel',
  'jean straight taille haute',
  'robe midi fleurie',
  'sneakers blanches',
  'manteau laine',
  'chemise col V',
];

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: SearchProduct }) {
  const theme = useAppTheme();
  return (
    <TouchableOpacity
      style={[
        cardStyles.card,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.borderLight },
      ]}
      onPress={() => product.link && void Linking.openURL(product.link)}
      activeOpacity={0.88}
    >
      <View style={cardStyles.imgWrap}>
        <Image
          source={{ uri: product.imageUrl }}
          style={cardStyles.img}
          contentFit="cover"
          transition={200}
        />
        {product.rating && (
          <View style={cardStyles.ratingBadge}>
            <Text style={cardStyles.ratingText}>★ {product.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <View style={cardStyles.info}>
        <Text style={[cardStyles.title, { color: theme.colors.textPrimary }]} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={[cardStyles.store, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {product.store}
        </Text>
        <View style={cardStyles.footer}>
          <Text style={cardStyles.price}>{product.price}</Text>
          <Text style={cardStyles.cta}>Voir →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F4F8',
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imgWrap: { position: 'relative' },
  img: { width: CARD_WIDTH, height: CARD_WIDTH * 1.2, backgroundColor: '#dbeafe' },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: { fontSize: 9, color: '#FFD700', fontFamily: 'Poppins_600SemiBold' },
  info: { padding: 10, gap: 3 },
  title: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#0D1B2A', lineHeight: 16 },
  store: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: '#A0AEC0' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: colors.primary[500] },
  cta: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: colors.primary[500] },
});

// ─── Sell Item Card ────────────────────────────────────────────────────────────

function SellItemCard({
  item,
  onList,
}: {
  item: DressingItem;
  onList: (item: DressingItem) => void;
}) {
  const theme = useAppTheme();
  return (
    <TouchableOpacity
      style={[
        sellStyles.card,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.borderLight },
      ]}
      onPress={() => onList(item)}
      activeOpacity={0.85}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={sellStyles.img} contentFit="cover" />
      ) : (
        <View style={[sellStyles.img, sellStyles.imgPlaceholder]}>
          <Ionicons name="shirt-outline" size={24} color={colors.primary[300]} />
        </View>
      )}
      <View style={sellStyles.info}>
        <Text style={[sellStyles.cat, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {item.category}
        </Text>
        {item.brand && (
          <Text style={[sellStyles.brand, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {item.brand}
          </Text>
        )}
        {item.primaryColor && (
          <Text style={[sellStyles.color, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {item.primaryColor}
          </Text>
        )}
      </View>
      <View style={sellStyles.listBtn}>
        <Text style={sellStyles.listBtnText}>Mettre en vente</Text>
      </View>
    </TouchableOpacity>
  );
}

const sellStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F4F8',
    overflow: 'hidden',
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    width: CARD_WIDTH,
  },
  img: { width: CARD_WIDTH, height: CARD_WIDTH, backgroundColor: '#dbeafe' },
  imgPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  info: { padding: 8, gap: 2 },
  cat: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: '#0D1B2A' },
  brand: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: '#A0AEC0' },
  color: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: '#A0AEC0' },
  listBtn: {
    margin: 8,
    marginTop: 0,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: '#00C4BF',
  },
  listBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: '#fff' },
});

// ─── List Modal ────────────────────────────────────────────────────────────────

function ListModal({
  item,
  visible,
  onClose,
}: {
  item: DressingItem | null;
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const [price, setPrice] = useState('');

  function handleSubmit() {
    if (!price.trim() || isNaN(Number(price))) {
      Alert.alert('Prix invalide', 'Entre un prix valide.');
      return;
    }
    Alert.alert(
      'Annonce publiée !',
      `Ta pièce est maintenant en vente pour ${price} €.\n\n(Fonctionnalité en cours de déploiement)`,
    );
    setPrice('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View
          style={[
            modalStyles.sheet,
            { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.borderLight },
          ]}
        >
          <View style={[modalStyles.handle, { backgroundColor: theme.colors.border }]} />
          <Text style={[modalStyles.title, { color: theme.colors.textPrimary }]}>
            Mettre en vente
          </Text>
          {item && (
            <View style={modalStyles.preview}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={modalStyles.previewImg}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    modalStyles.previewImg,
                    { backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
                  ]}
                >
                  <Ionicons name="shirt-outline" size={32} color={colors.primary[400]} />
                </View>
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[modalStyles.itemCat, { color: theme.colors.textPrimary }]}>
                  {item.category}
                </Text>
                {item.brand && (
                  <Text style={[modalStyles.itemBrand, { color: theme.colors.textMuted }]}>
                    {item.brand}
                  </Text>
                )}
                {item.primaryColor && (
                  <Text style={[modalStyles.itemColor, { color: theme.colors.textMuted }]}>
                    {item.primaryColor}
                  </Text>
                )}
              </View>
            </View>
          )}
          <Text style={[modalStyles.label, { color: theme.colors.textMuted }]}>
            PRIX DE VENTE (€)
          </Text>
          <TextInput
            style={[modalStyles.input, { color: theme.colors.textPrimary }]}
            value={price}
            onChangeText={setPrice}
            placeholder="Ex: 35"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            keyboardAppearance={theme.dark ? 'dark' : 'light'}
          />
          <View style={[modalStyles.inputLine, { backgroundColor: theme.colors.border }]} />
          <Text style={[modalStyles.hint, { color: theme.colors.textMuted }]}>
            La pièce sera visible par la communauté Outfit Now.
          </Text>
          <TouchableOpacity style={[modalStyles.btnWrap, modalStyles.btn]} onPress={handleSubmit}>
            <Text style={modalStyles.btnText}>PUBLIER L'ANNONCE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
            <Text style={[modalStyles.cancelText, { color: theme.colors.textMuted }]}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing[5],
    paddingBottom: spacing[10],
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#0D1B2A',
    marginBottom: spacing[4],
  },
  preview: {
    flexDirection: 'row',
    gap: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  previewImg: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#dbeafe' },
  itemCat: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#0D1B2A' },
  itemBrand: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#A0AEC0' },
  itemColor: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#A0AEC0' },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: '#A0AEC0',
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  input: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 22,
    color: '#0D1B2A',
    paddingVertical: spacing[2],
  },
  inputLine: { height: 1, backgroundColor: '#E2E8F0', marginBottom: spacing[2] },
  hint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#A0AEC0',
    marginBottom: spacing[5],
  },
  btnWrap: {
    borderRadius: 14,
    marginBottom: spacing[2],
    overflow: 'hidden',
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#00C4BF',
  },
  btnText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#fff', letterSpacing: 1 },
  cancelBtn: { paddingVertical: spacing[3], alignItems: 'center' },
  cancelText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#A0AEC0' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  const [tab, setTab] = useState<MarketTab>('buy');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [intent, setIntent] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [activeTier, setActiveTier] = useState<(typeof TIERS)[0] | null>(null);

  const [dressingItems, setDressingItems] = useState<DressingItem[]>([]);
  const [dressingLoading, setDressingLoading] = useState(false);
  const [listItem, setListItem] = useState<DressingItem | null>(null);

  const inputRef = useRef<TextInput>(null);
  const resultsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getSearchHistory()
      .then(setHistory)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'sell') return;
    setDressingLoading(true);
    getDressingItems({ pageSize: 50 })
      .then((res) => setDressingItems(res.data))
      .catch(() => {})
      .finally(() => setDressingLoading(false));
  }, [tab]);

  const doSearch = useCallback(
    async (q?: string, catOverride?: string | null, tier?: (typeof TIERS)[0] | null) => {
      const finalQuery = q ?? query;
      if (!finalQuery.trim()) return;
      const finalCat = catOverride !== undefined ? (catOverride ?? undefined) : category;
      const finalTier = tier !== undefined ? tier : activeTier;
      setLoading(true);
      setSearched(false);
      resultsAnim.setValue(0);
      try {
        const res = await searchStyle(finalQuery.trim(), {
          category: finalCat,
          maxPrice: finalTier?.maxPrice,
          minPrice: finalTier?.minPrice,
          maxResults: 12,
        });
        setResults(res.results);
        setIntent(res.intent);
        setSearched(true);
        Animated.timing(resultsAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        getSearchHistory()
          .then(setHistory)
          .catch(() => {});
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    },
    [query, category, activeTier],
  );

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setIntent('');
    resultsAnim.setValue(0);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: theme.colors.background },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Marketplace</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'buy' && styles.tabBtnActive]}
          onPress={() => setTab('buy')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.textMuted },
              tab === 'buy' && styles.tabTextActive,
            ]}
          >
            Acheter
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'sell' && styles.tabBtnActive]}
          onPress={() => setTab('sell')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.textMuted },
              tab === 'sell' && styles.tabTextActive,
            ]}
          >
            Revendre
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── BUY TAB ──────────────────────────────────────────────────────────── */}
      {tab === 'buy' && (
        <>
          {/* Search bar */}
          <View style={styles.searchBar}>
            <View
              style={[
                styles.inputWrap,
                { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="search-outline" size={16} color={theme.colors.textMuted} />
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="Rechercher une pièce…"
                placeholderTextColor={theme.colors.textMuted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => void doSearch()}
                returnKeyType="search"
                autoCapitalize="none"
                keyboardAppearance={theme.dark ? 'dark' : 'light'}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={clearSearch} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.goBtnWrap, !query.trim() && styles.goBtnDisabled]}
              onPress={() => void doSearch()}
              disabled={!query.trim() || loading}
            >
              {loading ? (
                <View style={styles.goBtn}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : query.trim() ? (
                <View style={styles.goBtn}>
                  <Text style={styles.goBtnText}>GO</Text>
                </View>
              ) : (
                <View style={[styles.goBtn, styles.goBtnInner]}>
                  <Text style={[styles.goBtnText, { color: '#A0AEC0' }]}>GO</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Tier cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tiersRow}
          >
            {TIERS.map((tier) => (
              <TouchableOpacity
                key={tier.label}
                style={[
                  styles.tierCard,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                  activeTier?.label === tier.label && styles.tierCardActive,
                ]}
                onPress={() => {
                  const next = activeTier?.label === tier.label ? null : tier;
                  setActiveTier(next);
                  if (searched && query.trim()) void doSearch(query, category ?? null, next);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.tierIcon}>{tier.icon}</Text>
                <Text
                  style={[
                    styles.tierLabel,
                    { color: theme.colors.textPrimary },
                    activeTier?.label === tier.label && styles.tierLabelActive,
                  ]}
                >
                  {tier.label}
                </Text>
                <Text style={[styles.tierDesc, { color: theme.colors.textMuted }]}>
                  {tier.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={String(c.value)}
                style={[
                  styles.chip,
                  { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border },
                  category === c.value && styles.chipActive,
                ]}
                onPress={() => {
                  setCategory(c.value);
                  if (searched && query.trim()) void doSearch(query, c.value ?? null);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: theme.colors.textMuted },
                    category === c.value && styles.chipTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                Recherche en cours…
              </Text>
            </View>
          )}

          {!loading && !searched && (
            <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
              {history.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
                    RÉCENTES
                  </Text>
                  {history.slice(0, 4).map((h, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.historyRow, { borderBottomColor: theme.colors.borderLight }]}
                      onPress={() => {
                        setQuery(h.query);
                        void doSearch(h.query);
                      }}
                    >
                      <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
                      <Text style={[styles.historyQuery, { color: theme.colors.textPrimary }]}>
                        {h.query}
                      </Text>
                      <Text style={[styles.historyCount, { color: theme.colors.textMuted }]}>
                        {h.count} résultats
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
                </>
              )}
              <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
                INSPIRATIONS
              </Text>
              <View style={styles.suggestionsGrid}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.suggChip,
                      { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border },
                    ]}
                    onPress={() => {
                      setQuery(s);
                      void doSearch(s);
                    }}
                  >
                    <Text style={[styles.suggText, { color: theme.colors.textPrimary }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {!loading && searched && (
            <Animated.View style={[{ flex: 1 }, { opacity: resultsAnim }]}>
              {intent && intent !== query && (
                <View style={styles.intentBanner}>
                  <Ionicons name="sparkles-outline" size={12} color={colors.primary[500]} />
                  <Text style={styles.intentText}>{intent}</Text>
                </View>
              )}
              {results.length === 0 ? (
                <View style={styles.center}>
                  <Ionicons name="search-outline" size={40} color={theme.colors.border} />
                  <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                    Aucun résultat
                  </Text>
                  <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                    Essaie d'autres mots-clés.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={(_, i) => String(i)}
                  numColumns={2}
                  columnWrapperStyle={{ gap: 12 }}
                  contentContainerStyle={styles.grid}
                  showsVerticalScrollIndicator={false}
                  ListHeaderComponent={
                    <Text style={[styles.resultsCount, { color: theme.colors.textMuted }]}>
                      {results.length} RÉSULTATS
                    </Text>
                  }
                  renderItem={({ item }) => <ProductCard product={item} />}
                />
              )}
            </Animated.View>
          )}
        </>
      )}

      {/* ── SELL TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'sell' && (
        <View style={{ flex: 1 }}>
          {/* Banner */}
          <View
            style={[
              styles.sellBanner,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.dark ? theme.colors.border : '#bfdbfe',
              },
            ]}
          >
            <Ionicons name="pricetag-outline" size={20} color={colors.primary[500]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.sellBannerTitle, { color: theme.colors.textPrimary }]}>
                Revends tes pièces
              </Text>
              <Text style={[styles.sellBannerSub, { color: theme.colors.textMuted }]}>
                Sélectionne une pièce de ta garde-robe pour la mettre en vente.
              </Text>
            </View>
          </View>

          {dressingLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
            </View>
          ) : dressingItems.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="shirt-outline" size={48} color={theme.colors.border} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                Garde-robe vide
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                Ajoute des vêtements pour commencer à vendre.
              </Text>
            </View>
          ) : (
            <FlatList
              data={dressingItems}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={[styles.resultsCount, { color: theme.colors.textMuted }]}>
                  {dressingItems.length} PIÈCES DISPONIBLES
                </Text>
              }
              renderItem={({ item }) => <SellItemCard item={item} onList={(i) => setListItem(i)} />}
            />
          )}
        </View>
      )}

      <ListModal item={listItem} visible={!!listItem} onClose={() => setListItem(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  backBtn: { padding: spacing[1] },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#0D1B2A' },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: colors.primary[500] },
  tabText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#A0AEC0' },
  tabTextActive: { fontFamily: 'Poppins_600SemiBold', color: colors.primary[500] },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    borderRadius: 12,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#0D1B2A',
    paddingVertical: spacing[2],
  },
  goBtnWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    minWidth: 48,
  },
  goBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 48,
    alignItems: 'center',
    backgroundColor: '#00C4BF',
  },
  goBtnInner: { backgroundColor: '#E2E8F0' },
  goBtnDisabled: { backgroundColor: '#E2E8F0' },
  goBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#fff' },

  tiersRow: { paddingHorizontal: spacing[4], paddingBottom: spacing[3], gap: 10 },
  tierCard: {
    width: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: spacing[3],
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAFAFA',
  },
  tierCardActive: { borderColor: colors.primary[500], backgroundColor: 'rgba(0,196,191,0.06)' },
  tierIcon: { fontSize: 20 },
  tierLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#0D1B2A' },
  tierLabelActive: { color: colors.primary[500] },
  tierDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: '#A0AEC0',
    textAlign: 'center',
  },

  filterRow: { paddingHorizontal: spacing[4], paddingBottom: spacing[2], gap: spacing[2] },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9999,
    backgroundColor: '#f8faff',
  },
  chipActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  chipText: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#A0AEC0' },
  chipTextActive: { color: '#fff' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  loadingText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#A0AEC0' },

  suggestionsContainer: { flex: 1, paddingHorizontal: spacing[5] },
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#A0AEC0',
    letterSpacing: 2,
    marginTop: spacing[4],
    marginBottom: spacing[3],
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  historyQuery: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#0D1B2A' },
  historyCount: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: '#A0AEC0' },
  divider: { height: 1, backgroundColor: '#F0F4F8', marginVertical: spacing[2] },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    paddingBottom: spacing[8],
  },
  suggChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9999,
    backgroundColor: '#f8faff',
  },
  suggText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#0D1B2A' },

  intentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    margin: spacing[4],
    marginBottom: spacing[2],
    backgroundColor: 'rgba(0,196,191,0.06)',
    borderRadius: 10,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(0,196,191,0.2)',
  },
  intentText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.primary[500],
    flex: 1,
  },
  resultsCount: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#A0AEC0',
    letterSpacing: 2,
    marginBottom: spacing[3],
  },
  grid: { padding: spacing[5], paddingTop: spacing[2], gap: 12 },
  emptyTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#0D1B2A' },
  emptySub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#A0AEC0',
    textAlign: 'center',
    paddingHorizontal: spacing[6],
  },

  sellBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    margin: spacing[4],
    padding: spacing[4],
    backgroundColor: '#f8faff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  sellBannerTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#0D1B2A' },
  sellBannerSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#A0AEC0',
    lineHeight: 18,
  },
});

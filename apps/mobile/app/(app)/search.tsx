import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@outfit-now/design-tokens';
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
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { searchStyle, getSearchHistory, type SearchProduct, type SearchHistoryEntry } from '../../lib/search';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing[4] * 2 - spacing[3]) / 2;

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

type BudgetOption = {
  label: string;
  maxPrice?: number;
  minPrice?: number;
};
const BUDGETS: BudgetOption[] = [
  { label: 'Tout budget' },
  { label: '< 50 €',   maxPrice: 50 },
  { label: '< 100 €',  maxPrice: 100 },
  { label: '< 200 €',  maxPrice: 200 },
  { label: '< 500 €',  maxPrice: 500 },
  { label: '500 €+',   minPrice: 500 },
];

const SUGGESTIONS = [
  'blazer oversize camel femme',
  'jean straight taille haute',
  'robe midi fleurie',
  'sneakers blanches plateforme',
  'manteau laine camel',
  'chemise blanche col V',
];

const LUXURY_BRANDS = [
  { label: 'AMIRI', query: 'Amiri' },
  { label: 'GUCCI', query: 'Gucci' },
  { label: 'DIOR', query: 'Christian Dior' },
  { label: 'LOUIS VUITTON', query: 'Louis Vuitton' },
  { label: 'PRADA', query: 'Prada' },
  { label: 'BALENCIAGA', query: 'Balenciaga' },
  { label: 'SAINT LAURENT', query: 'Yves Saint Laurent' },
  { label: 'BOTTEGA', query: 'Bottega Veneta' },
  { label: 'VALENTINO', query: 'Valentino' },
  { label: 'LOEWE', query: 'Loewe' },
];

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: SearchProduct }) {
  const scale = useRef(new Animated.Value(1)).current;

  function onIn() { Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start(); }
  function onOut() { Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start(); }

  return (
    <Animated.View style={[cardStyles.wrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={() => product.link && void Linking.openURL(product.link)}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
      >
        <View style={cardStyles.imgWrap}>
          <Image source={{ uri: product.imageUrl }} style={cardStyles.img} contentFit="cover" transition={200} />
          {product.rating && (
            <View style={cardStyles.ratingBadge}>
              <Text style={cardStyles.ratingText}>★ {product.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={cardStyles.info}>
          <Text style={cardStyles.title} numberOfLines={2}>{product.title}</Text>
          <Text style={cardStyles.store} numberOfLines={1}>{product.store}</Text>
          <Text style={cardStyles.price}>{product.price}</Text>
        </View>
        <View style={cardStyles.cta}>
          <Text style={cardStyles.ctaText}>VOIR →</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  wrap: {
    width: CARD_WIDTH,
    backgroundColor: colors.neutral[900],
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  imgWrap: { position: 'relative' },
  img: { width: CARD_WIDTH, height: CARD_WIDTH * 1.2 },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: { fontSize: 9, color: '#FFD700', fontWeight: '700' },
  info: { padding: spacing[3], gap: 3 },
  title: { fontSize: 11, color: colors.neutral[0], lineHeight: 15, fontWeight: typography.fontWeight.medium },
  store: { fontSize: 9, color: colors.neutral[500], letterSpacing: 0.5 },
  price: { fontSize: typography.fontSize.sm, color: colors.primary[500], fontWeight: typography.fontWeight.bold, marginTop: 2 },
  cta: { paddingHorizontal: spacing[3], paddingBottom: spacing[3] },
  ctaText: { fontSize: 9, color: colors.primary[400], letterSpacing: 1.5, fontWeight: typography.fontWeight.black },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<SearchProduct[]>([]);
  const [history, setHistory]     = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [intent, setIntent]       = useState('');
  const [category, setCategory]   = useState<string | undefined>(undefined);
  const [maxPrice, setMaxPrice]   = useState<number | undefined>(undefined);
  const [minPrice, setMinPrice]   = useState<number | undefined>(undefined);
  const [luxeBrand, setLuxeBrand] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
  const resultsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getSearchHistory().then(setHistory).catch(() => {});
  }, []);

  const doSearch = useCallback(async (q?: string, catOverride?: string | null, maxOverride?: number | null, minOverride?: number | null) => {
    const finalQuery = q ?? query;
    if (!finalQuery.trim()) return;
    const finalCat = catOverride !== undefined ? (catOverride ?? undefined) : category;
    const finalMax = maxOverride !== undefined ? (maxOverride ?? undefined) : maxPrice;
    const finalMin = minOverride !== undefined ? (minOverride ?? undefined) : minPrice;
    setLoading(true);
    setSearched(false);
    try {
      const res = await searchStyle(finalQuery.trim(), { category: finalCat, maxPrice: finalMax, minPrice: finalMin, maxResults: 12 });
      setResults(res.results);
      setIntent(res.intent);
      setSearched(true);
      Animated.timing(resultsAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      // Refresh history
      getSearchHistory().then(setHistory).catch(() => {});
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, [query, category, maxPrice, minPrice]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setIntent('');
    resultsAnim.setValue(0);
    inputRef.current?.focus();
  };

  const showSuggestions = !searched && !loading && query.length === 0;
  const showHistory     = !searched && !loading && history.length > 0 && query.length === 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[0]} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={16} color={colors.neutral[500]} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Rechercher un style, une pièce…"
            placeholderTextColor={colors.neutral[600]}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void doSearch()}
            returnKeyType="search"
            autoCapitalize="none"
            keyboardAppearance="light"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.neutral[500]} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchBtn, !query.trim() && styles.searchBtnDisabled]}
          onPress={() => void doSearch()}
          disabled={!query.trim() || loading}
        >
          {loading
            ? <ActivityIndicator size="small" color={colors.neutral[950]} />
            : <Text style={styles.searchBtnText}>GO</Text>}
        </TouchableOpacity>
      </View>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <View style={styles.filtersBlock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={String(c.value)}
              style={[styles.filterChip, category === c.value && styles.filterChipActive]}
              onPress={() => {
                setCategory(c.value);
                if (searched && query.trim()) void doSearch(query, c.value ?? null, maxPrice ?? null);
              }}
            >
              <Text style={[styles.filterChipText, category === c.value && styles.filterChipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {BUDGETS.map((b) => (
            <TouchableOpacity
              key={String(b.value)}
              style={[styles.filterChip, maxPrice === b.maxPrice && minPrice === b.minPrice && styles.filterChipActive]}
              onPress={() => {
                setMaxPrice(b.maxPrice);
                setMinPrice(b.minPrice);
                if (searched && query.trim()) void doSearch(query, category ?? null, b.maxPrice ?? null, b.minPrice ?? null);
              }}
            >
              <Text style={[styles.filterChipText, maxPrice === b.value && styles.filterChipTextActive]}>
                {b.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Karl cherche pour toi…</Text>
        </View>
      )}

      {!loading && !searched && showSuggestions && (
        <ScrollView style={styles.suggestionsContainer}>
          {showHistory && (
            <>
              <Text style={styles.sectionLabel}>RECHERCHES RÉCENTES</Text>
              {history.slice(0, 5).map((h, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.historyRow}
                  onPress={() => { setQuery(h.query); void doSearch(h.query); }}
                >
                  <Ionicons name="time-outline" size={14} color={colors.neutral[500]} />
                  <View style={styles.historyText}>
                    <Text style={styles.historyQuery}>{h.query}</Text>
                    {h.intent && h.intent !== h.query && (
                      <Text style={styles.historyIntent} numberOfLines={1}>{h.intent}</Text>
                    )}
                  </View>
                  <Text style={styles.historyCount}>{h.count} résultats</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.divider} />
            </>
          )}

          <Text style={styles.sectionLabel}>MARQUES LUXE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2], paddingBottom: spacing[3] }}>
            {LUXURY_BRANDS.map((b) => (
              <TouchableOpacity
                key={b.query}
                style={[styles.luxeChip, luxeBrand === b.query && styles.luxeChipActive]}
                onPress={() => {
                  const newBrand = luxeBrand === b.query ? null : b.query;
                  setLuxeBrand(newBrand);
                  const newQuery = newBrand ? newBrand : '';
                  if (newQuery) { setQuery(newQuery); void doSearch(newQuery); }
                }}
              >
                <Text style={[styles.luxeChipText, luxeBrand === b.query && styles.luxeChipTextActive]}>
                  {b.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>INSPIRATIONS</Text>
          <View style={styles.suggestionsGrid}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => { setQuery(s); void doSearch(s); }}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {!loading && searched && (
        <Animated.View style={[styles.resultsContainer, { opacity: resultsAnim }]}>
          {intent && intent !== query && (
            <View style={styles.intentBanner}>
              <Ionicons name="sparkles-outline" size={12} color={colors.primary[500]} />
              <Text style={styles.intentText}>{intent}</Text>
            </View>
          )}

          {results.length === 0 ? (
            <View style={styles.emptyResults}>
              <Ionicons name="search-outline" size={40} color={colors.neutral[700]} />
              <Text style={styles.emptyTitle}>Aucun résultat</Text>
              <Text style={styles.emptySub}>
                Essaie d'autres mots-clés ou active une clé API dans .env (SERPAPI_KEY ou SERPER_API_KEY).
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(_, i) => String(i)}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={styles.resultsCount}>{results.length} RÉSULTATS</Text>
              }
              renderItem={({ item }) => <ProductCard product={item} />}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[800],
  },
  backBtn: { padding: spacing[1] },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[900],
    borderRadius: 9999,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  searchIcon: {},
  input: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[0],
    paddingVertical: spacing[2],
  },
  searchBtn: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 9999,
    minWidth: 44,
    alignItems: 'center',
  },
  searchBtnDisabled: { backgroundColor: colors.neutral[700] },
  searchBtnText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[950],
    letterSpacing: 1,
  },

  // Filters
  filtersBlock: { borderBottomWidth: 1, borderBottomColor: colors.neutral[800] },
  filterRow: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], gap: spacing[2] },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    borderRadius: 9999,
    backgroundColor: colors.neutral[900],
  },
  filterChipActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  filterChipText: { fontSize: 10, color: colors.neutral[500], letterSpacing: 1, fontWeight: typography.fontWeight.medium },
  filterChipTextActive: { color: colors.neutral[950] },

  // Loading
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  loadingText: { fontSize: typography.fontSize.sm, color: colors.neutral[500], letterSpacing: 1 },

  // Suggestions
  suggestionsContainer: { flex: 1, paddingHorizontal: spacing[4] },
  sectionLabel: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
    marginTop: spacing[5],
    marginBottom: spacing[3],
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  historyText: { flex: 1 },
  historyQuery: { fontSize: typography.fontSize.sm, color: colors.neutral[0], fontWeight: typography.fontWeight.medium },
  historyIntent: { fontSize: 10, color: colors.neutral[600], marginTop: 2 },
  historyCount: { fontSize: 9, color: colors.neutral[600], letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: colors.neutral[800], marginVertical: spacing[4] },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], paddingBottom: spacing[8] },
  suggestionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    borderRadius: 9999,
    backgroundColor: colors.neutral[900],
  },
  suggestionText: { fontSize: 11, color: colors.neutral[400], letterSpacing: 0.3 },

  // Results
  resultsContainer: { flex: 1 },
  intentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    marginBottom: spacing[1],
    backgroundColor: 'rgba(36,72,216,0.08)',
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.primary[600],
  },
  intentText: { fontSize: 11, color: colors.primary[500], flex: 1, letterSpacing: 0.3 },
  resultsCount: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
    marginBottom: spacing[3],
  },
  grid: { padding: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  row: { gap: spacing[3] },
  luxeChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[700],
    borderRadius: 9999,
    backgroundColor: colors.neutral[900],
  },
  luxeChipActive: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[0],
  },
  luxeChipText: {
    fontSize: 9,
    color: colors.neutral[400],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },
  luxeChipTextActive: { color: colors.neutral[950] },
  emptyResults: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[8] },
  emptyTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.neutral[0] },
  emptySub: { fontSize: typography.fontSize.sm, color: colors.neutral[500], textAlign: 'center', lineHeight: 20 },
});

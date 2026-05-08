import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@outfit-now/design-tokens';
import type { ClothingCategory, DressingItem } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  TextInput,
  ScrollView,
} from 'react-native';

import { useAppTheme } from '../../../contexts/ThemeContext';
import { useDressingStore } from '../../../hooks/useDressing';
import { getDressingItems } from '../../../lib/dressing';

const WIN_WIDTH = Dimensions.get('window').width;
const ITEM_SIZE = (WIN_WIDTH - spacing[5] * 2 - 8) / 3;

const CATEGORIES = [
  { label: 'Tout', value: null },
  { label: 'Hauts', value: 'tops' },
  { label: 'Bas', value: 'bottoms' },
  { label: 'Robes', value: 'dresses' },
  { label: 'Chaussures', value: 'shoes' },
  { label: 'Accessoires', value: 'accessories' },
];

export default function DressingScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { items, total, hasMore, isLoading, categoryFilter, loadItems, setCategoryFilter } =
    useDressingStore();

  const [tab, setTab] = useState<'dressing' | 'sale'>('dressing');
  const [saleItems, setSaleItems] = useState<DressingItem[]>([]);
  const [saleLoading, setSaleLoading] = useState(false);
  const [search, setSearch] = useState('');

  async function loadSaleItems() {
    setSaleLoading(true);
    try {
      const res = await getDressingItems({ forSale: true, pageSize: 50 });
      setSaleItems(res.data);
    } catch {
      // ignore
    } finally {
      setSaleLoading(false);
    }
  }

  useEffect(() => {
    void loadItems(true);
  }, []);

  useEffect(() => {
    if (tab === 'sale') void loadSaleItems();
  }, [tab]);

  const onEndReached = useCallback(() => {
    if (hasMore && !isLoading) void loadItems();
  }, [hasMore, isLoading]);

  function renderItem({ item }: { item: DressingItem }) {
    return (
      <Link href={`/(app)/dressing/${item.id}` as never} asChild>
        <TouchableOpacity
          style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.itemImage}
            contentFit="cover"
            transition={200}
          />
          {item.forSale && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>
                {item.askingPrice != null ? `${item.askingPrice} €` : 'VENTE'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Link>
    );
  }

  function renderSaleItem({ item }: { item: DressingItem }) {
    return (
      <Link href={`/(app)/dressing/${item.id}` as never} asChild>
        <TouchableOpacity
          style={[
            styles.saleCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.saleImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.saleCardInfo}>
            <View style={styles.saleCardLeft}>
              <Text style={styles.saleCardCategory}>{(item.category ?? '').toUpperCase()}</Text>
              <Text
                style={[styles.saleCardColor, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.primaryColor}
              </Text>
              {item.brand && (
                <Text style={styles.saleCardBrand} numberOfLines={1}>
                  {item.brand}
                </Text>
              )}
              {item.styleTags[0] && (
                <Text style={styles.saleCardTag}>{item.styleTags[0].toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.saleCardRight}>
              {item.askingPrice != null ? (
                <>
                  <Text style={styles.saleCardPrice}>{item.askingPrice}</Text>
                  <Text style={styles.saleCardCurrency}>EUR</Text>
                </>
              ) : (
                <Text style={styles.saleCardNprice}>Prix libre</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  }

  const headerColors: [string, string, string] = theme.dark
    ? ['#0f172a', '#0a0f1e', '#0a0f1e']
    : ['#dbeafe', '#f8faff', '#ffffff'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.colors.statusBar} />

      {/* Header */}
      <LinearGradient
        colors={headerColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Garde-robe</Text>
          <TouchableOpacity
            style={[
              styles.filterIconBtn,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            hitSlop={8}
          >
            <Ionicons name="options-outline" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search bar */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          placeholder="Rechercher une pièce"
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CATEGORIES.map((cat) => {
          const active = categoryFilter === cat.value;
          return (
            <TouchableOpacity
              key={cat.label}
              style={[
                styles.chip,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                active && styles.chipActive,
              ]}
              onPress={() => setCategoryFilter(active ? null : (cat.value as ClothingCategory))}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: theme.colors.textMuted },
                  active && styles.chipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Count + sort row */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: theme.colors.textPrimary }]}>
          {tab === 'dressing' ? total : saleItems.length} pièces
        </Text>
        <TouchableOpacity
          style={[styles.tabBtnSale, tab === 'sale' && styles.tabBtnSaleActive]}
          onPress={() => setTab(tab === 'dressing' ? 'sale' : 'dressing')}
        >
          <Text style={[styles.tabBtnSaleText, tab === 'sale' && styles.tabBtnSaleTextActive]}>
            {tab === 'sale' ? 'EN VENTE' : 'Trier ↓'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dressing grid */}
      {tab === 'dressing' && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && items.length === 0}
              onRefresh={() => loadItems(true)}
              tintColor="#00C4BF"
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  Ton dressing est vide.
                </Text>
                <Text style={[styles.emptySubText, { color: theme.colors.textMuted }]}>
                  Scanne ta première pièce pour commencer.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isLoading && items.length > 0 ? (
              <ActivityIndicator style={{ marginVertical: spacing[6] }} color="#00C4BF" />
            ) : null
          }
        />
      )}

      {/* En vente tab */}
      {tab === 'sale' && (
        <FlatList
          data={saleItems}
          keyExtractor={(item) => item.id}
          renderItem={renderSaleItem}
          contentContainerStyle={styles.saleList}
          refreshControl={
            <RefreshControl
              refreshing={saleLoading}
              onRefresh={loadSaleItems}
              tintColor="#00C4BF"
            />
          }
          ListEmptyComponent={
            !saleLoading ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  Aucune pièce en vente.
                </Text>
                <Text style={[styles.emptySubText, { color: theme.colors.textMuted }]}>
                  Ouvre une pièce et appuie sur "METTRE EN VENTE".
                </Text>
              </View>
            ) : null
          }
          ListHeaderComponent={
            saleItems.length > 0 ? (
              <View style={[styles.saleHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.saleHeaderText, { color: theme.colors.textMuted }]}>
                  Copie le lien ou partage sur Vinted / Leboncoin
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fabWrap}
        onPress={() => router.push('/(app)/scan' as never)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#1e40af', '#2563eb', '#00c4bf']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  headerGradient: {
    paddingTop: spacing[16],
    paddingBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#0D1B2A',
  },
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8faff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#0D1B2A',
    paddingVertical: 0,
  },

  // Category chips
  chipsRow: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#00C4BF',
    borderColor: '#00C4BF',
  },
  chipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#A0AEC0',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // Count row
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  countText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#0D1B2A',
  },
  tabBtnSale: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  tabBtnSaleActive: {
    backgroundColor: '#dbeafe',
  },
  tabBtnSaleText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#00C4BF',
  },
  tabBtnSaleTextActive: {
    color: '#00C4BF',
  },

  // Grid
  grid: { paddingHorizontal: spacing[5], paddingBottom: spacing[20] },
  row: { gap: 4, marginBottom: 4 },
  itemCard: {
    width: ITEM_SIZE,
    backgroundColor: '#f8faff',
    overflow: 'hidden',
    borderRadius: 12,
  },
  itemImage: { width: ITEM_SIZE, height: ITEM_SIZE * 1.3 },
  saleBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: '#00C4BF',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 6,
  },
  saleBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#FFFFFF',
  },

  // Sale list
  saleList: { padding: spacing[5], gap: spacing[3] },
  saleHeader: {
    marginBottom: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  saleHeaderText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#A0AEC0',
  },
  saleCard: {
    flexDirection: 'row',
    backgroundColor: '#f8faff',
    overflow: 'hidden',
    marginBottom: spacing[3],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saleImage: { width: 90, height: 110 },
  saleCardInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  saleCardLeft: { flex: 1, gap: 4 },
  saleCardCategory: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#00C4BF',
    letterSpacing: 2,
  },
  saleCardColor: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#0D1B2A',
    textTransform: 'capitalize',
  },
  saleCardBrand: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#A0AEC0',
    fontStyle: 'italic',
  },
  saleCardTag: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: '#A0AEC0',
    letterSpacing: 1,
  },
  saleCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  saleCardPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#00C4BF',
    lineHeight: 28,
  },
  saleCardCurrency: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: '#A0AEC0',
    letterSpacing: 2,
  },
  saleCardNprice: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: '#A0AEC0',
    fontStyle: 'italic',
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: spacing[20],
    gap: spacing[2],
  },
  emptyText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#A0AEC0',
  },
  emptySubText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#A0AEC0',
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },

  // FAB
  fabWrap: {
    position: 'absolute',
    bottom: spacing[8],
    right: spacing[5],
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    lineHeight: 30,
  },
});

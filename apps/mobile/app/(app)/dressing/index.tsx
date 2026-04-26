import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@outfit-now/design-tokens';
import type { DressingItem } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
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
} from 'react-native';

import { CategoryFilter } from '../../../components/ui/CategoryFilter';
import { useDressingStore } from '../../../hooks/useDressing';
import { getDressingItems } from '../../../lib/dressing';

const ITEM_SIZE = (Dimensions.get('window').width - spacing[6] * 2 - spacing[3]) / 2;

export default function DressingScreen() {
  const router = useRouter();
  const { items, total, hasMore, isLoading, categoryFilter, loadItems, setCategoryFilter } =
    useDressingStore();

  // ── Resale tab state ───────────────────────────────────────────────────────
  const [tab, setTab] = useState<'dressing' | 'sale'>('dressing');
  const [saleItems, setSaleItems] = useState<DressingItem[]>([]);
  const [saleLoading, setSaleLoading] = useState(false);

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
        <TouchableOpacity style={styles.itemCard} activeOpacity={0.85}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.itemImage}
            contentFit="cover"
            transition={200}
          />
          {/* For-sale badge */}
          {item.forSale && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>
                {item.askingPrice != null ? `${item.askingPrice} €` : 'VENTE'}
              </Text>
            </View>
          )}
          <View style={styles.itemMeta}>
            <Text style={styles.itemColor} numberOfLines={1}>
              {item.primaryColor}
            </Text>
            {item.styleTags[0] && (
              <Text style={styles.itemTag} numberOfLines={1}>
                {item.styleTags[0].toUpperCase()}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Link>
    );
  }

  function renderSaleItem({ item }: { item: DressingItem }) {
    return (
      <Link href={`/(app)/dressing/${item.id}` as never} asChild>
        <TouchableOpacity style={styles.saleCard} activeOpacity={0.85}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.saleImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.saleCardInfo}>
            <View style={styles.saleCardLeft}>
              <Text style={styles.saleCardCategory}>
                {(item.category ?? '').toUpperCase()}
              </Text>
              <Text style={styles.saleCardColor} numberOfLines={1}>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>MON</Text>
          <Text style={styles.title}>DRESSING</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <TouchableOpacity
            onPress={() => router.push('/(app)/search' as never)}
            style={styles.searchIconBtn}
            hitSlop={8}
          >
            <Ionicons name="search-outline" size={22} color={colors.primary[500]} />
          </TouchableOpacity>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{tab === 'dressing' ? total : saleItems.length}</Text>
          <Text style={styles.countLabel}>{tab === 'dressing' ? 'PIÈCES' : 'EN VENTE'}</Text>
        </View>
        </View>
      </View>

      {/* ── Tab toggle ────────────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'dressing' && styles.tabBtnActive]}
          onPress={() => setTab('dressing')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, tab === 'dressing' && styles.tabBtnTextActive]}>
            MON DRESSING
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'sale' && styles.tabBtnActive]}
          onPress={() => setTab('sale')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, tab === 'sale' && styles.tabBtnTextActive]}>
            EN VENTE
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Dressing tab ──────────────────────────────────────────────────── */}
      {tab === 'dressing' && (
        <>
          <CategoryFilter selected={categoryFilter} onSelect={setCategoryFilter} />
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={isLoading && items.length === 0}
                onRefresh={() => loadItems(true)}
                tintColor={colors.primary[400]}
              />
            }
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyAccent}>VIDE</Text>
                  <Text style={styles.emptyText}>Ton dressing est vide.</Text>
                  <Text style={styles.emptySubText}>Scanne ta première pièce pour commencer.</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              isLoading && items.length > 0 ? (
                <ActivityIndicator style={{ marginVertical: spacing[6] }} color={colors.primary[400]} />
              ) : null
            }
          />
        </>
      )}

      {/* ── En vente tab ──────────────────────────────────────────────────── */}
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
              tintColor={colors.primary[400]}
            />
          }
          ListEmptyComponent={
            !saleLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyAccent}>◎</Text>
                <Text style={styles.emptyText}>Aucune pièce en vente.</Text>
                <Text style={styles.emptySubText}>
                  Ouvre une pièce et appuie sur "METTRE EN VENTE".
                </Text>
              </View>
            ) : null
          }
          ListHeaderComponent={
            saleItems.length > 0 ? (
              <View style={styles.saleHeader}>
                <Text style={styles.saleHeaderText}>
                  Copie le lien ou partage sur Vinted / Leboncoin
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* ── FAB (scan) — visible on dressing tab only ─────────────────────── */}
      {tab === 'dressing' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/scan' as never)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
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
    letterSpacing: -0.5,
  },
  countBadge: { alignItems: 'flex-end' },
  countText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.primary[400],
    lineHeight: 28,
  },
  countLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },

  // ── Tab toggle ───────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[800],
    borderRadius: 9999,
  },
  tabBtnActive: {
    borderColor: colors.primary[600],
    backgroundColor: 'rgba(36,72,216,0.08)',
  },
  tabBtnText: {
    fontSize: 10,
    color: colors.neutral[600],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },
  tabBtnTextActive: {
    color: colors.primary[400],
  },

  // ── Dressing grid ────────────────────────────────────────────────────────
  grid: { padding: spacing[6], paddingTop: spacing[4] },
  row: { gap: spacing[3], marginBottom: spacing[3] },
  itemCard: {
    width: ITEM_SIZE,
    backgroundColor: colors.neutral[900],
    overflow: 'hidden',
    borderRadius: 14,
  },
  itemImage: { width: ITEM_SIZE, height: ITEM_SIZE * 1.3 },
  itemMeta: { padding: spacing[3], gap: 2 },
  itemColor: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[300],
    fontWeight: typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  itemTag: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 1,
  },
  saleBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  saleBadgeText: {
    fontSize: 9,
    color: colors.neutral[950],
    fontWeight: typography.fontWeight.black,
    letterSpacing: 0.5,
  },

  // ── Sale list ─────────────────────────────────────────────────────────────
  saleList: { padding: spacing[6], gap: spacing[3] },
  saleHeader: {
    marginBottom: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  saleHeaderText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    letterSpacing: 0.5,
  },
  saleCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[900],
    overflow: 'hidden',
    marginBottom: spacing[3],
    borderRadius: 14,
  },
  saleImage: {
    width: 90,
    height: 110,
  },
  saleCardInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  saleCardLeft: { flex: 1, gap: 4 },
  saleCardCategory: {
    fontSize: 9,
    color: colors.primary[500],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },
  saleCardColor: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[0],
    fontWeight: typography.fontWeight.bold,
    textTransform: 'capitalize',
  },
  saleCardBrand: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  saleCardTag: {
    fontSize: 9,
    color: colors.neutral[700],
    letterSpacing: 1,
  },
  saleCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  saleCardPrice: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.primary[400],
    lineHeight: 28,
  },
  saleCardCurrency: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 2,
  },
  saleCardNprice: {
    fontSize: 10,
    color: colors.neutral[600],
    letterSpacing: 1,
    fontStyle: 'italic',
  },

  // ── Empty state ──────────────────────────────────────────────────────────
  empty: {
    alignItems: 'center',
    paddingTop: spacing[20],
    gap: spacing[2],
  },
  emptyAccent: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[900],
    letterSpacing: 8,
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
    fontWeight: typography.fontWeight.medium,
  },
  emptySubText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },

  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(36,72,216,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── FAB ──────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: spacing[8],
    right: spacing[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2448D8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  fabIcon: {
    fontSize: 26,
    color: colors.neutral[950],
    lineHeight: 30,
    fontWeight: typography.fontWeight.bold,
  },
});

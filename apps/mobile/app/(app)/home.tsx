import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@outfit-now/design-tokens';
import type { Outfit } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../hooks/useAuth';
import { useWeather } from '../../hooks/useWeather';
import { getOutfits } from '../../lib/briefs';
import { getDressingItems } from '../../lib/dressing';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { weather, daily } = useWeather();
  const theme = useAppTheme();

  const [dressingCount, setDressingCount] = useState<number | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const load = useCallback(async () => {
    try {
      const [dressingRes, outfitsRes] = await Promise.all([
        getDressingItems({ pageSize: 1 }),
        getOutfits({ pageSize: 6 }),
      ]);
      setDressingCount(dressingRes.total);
      setOutfits(outfitsRes.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const firstName = user?.firstName ?? '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : 'Bonsoir';

  const wardrobeLabel = theme.colors.textMuted;
  const wardrobeCount = theme.colors.textPrimary;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary[500]}
        />
      }
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header */}
        <View style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: theme.colors.textPrimary }]}>
                {greeting} {firstName} 👋
              </Text>
              <Text style={[styles.headerSub, { color: theme.colors.textMuted }]}>
                Prête à trouver ton look parfait ?
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.bellBtn,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={() => {}}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2-col context cards */}
        <View style={styles.contextRow}>
          {/* Weather card */}
          <TouchableOpacity
            style={[
              styles.contextCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
            onPress={() => setShowWeatherModal(true)}
            activeOpacity={0.85}
          >
            <Text style={[styles.contextCardLabel, { color: theme.colors.textMuted }]}>Météo</Text>
            <View style={styles.weatherMain}>
              <Text style={styles.weatherEmoji}>{weather ? weather.emoji : '🌡️'}</Text>
              <Text style={[styles.weatherTemp, { color: theme.colors.textPrimary }]}>
                {weather ? `${weather.tempC}°` : '—'}
              </Text>
            </View>
            <Text style={[styles.weatherDesc, { color: theme.colors.textMuted }]}>
              {weather ? weather.description : '…'}
            </Text>
            <Text style={[styles.weatherTap, { color: theme.colors.primaryBrand }]}>Semaine →</Text>
          </TouchableOpacity>

          {/* Garde-robe card */}
          <TouchableOpacity
            style={[
              styles.contextCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                position: 'relative',
                overflow: 'hidden',
              },
            ]}
            onPress={() => router.push('/(app)/dressing')}
            activeOpacity={0.85}
          >
            <Text style={[styles.contextCardLabel, { color: wardrobeLabel }]}>Garde-robe</Text>
            <Text style={[styles.wardrobeCount, { color: wardrobeCount }]}>
              {dressingCount ?? '—'}
            </Text>
            <Text style={[styles.wardrobeSub, { color: wardrobeLabel }]}>pièces</Text>
            <View style={styles.wardrobeIcon}>
              <Ionicons name="shirt-outline" size={18} color={colors.primary[500]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Generate CTA */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/stylist')}
          activeOpacity={0.88}
          style={styles.generateBtnWrap}
        >
          <View style={styles.generateBtn}>
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.generateBtnText}>Générer une tenue</Text>
          </View>
        </TouchableOpacity>

        {/* Marketplace */}
        <TouchableOpacity
          style={[
            styles.sectionCard,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
          onPress={() => router.push('/(app)/search' as never)}
          activeOpacity={0.85}
        >
          <View>
            <Text style={[styles.sectionCardLabel, { color: theme.colors.textPrimary }]}>
              Marketplace
            </Text>
            <Text style={[styles.sectionCardSub, { color: theme.colors.textMuted }]}>
              Acheter · Marques · Inspirations
            </Text>
          </View>
          <Ionicons name="bag-outline" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        {/* Communauté */}
        <TouchableOpacity
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.dark ? theme.colors.border : '#bfdbfe',
              marginBottom: spacing[5],
            },
          ]}
          onPress={() => router.push('/(app)/social' as never)}
          activeOpacity={0.85}
        >
          <View>
            <Text style={[styles.sectionCardLabel, { color: theme.colors.textPrimary }]}>
              Communauté
            </Text>
            <Text style={[styles.sectionCardSub, { color: theme.colors.textMuted }]}>
              Style Feed · Explorer les looks
            </Text>
          </View>
          <Ionicons name="people-outline" size={22} color={colors.primary[500]} />
        </TouchableOpacity>

        {/* Suggestions du jour */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Suggestions du jour
          </Text>
          <TouchableOpacity onPress={() => router.push('/(app)/outfits')} hitSlop={8}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {outfits.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsScroll}
            contentContainerStyle={{ gap: 12, paddingRight: spacing[5] }}
          >
            {outfits.slice(0, 6).map((outfit, i) => (
              <SuggestionCard key={outfit.id} outfit={outfit} index={i} />
            ))}
          </ScrollView>
        ) : !loading ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="shirt-outline" size={32} color={colors.primary[500]} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              Aucune tenue générée
            </Text>
            <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
              Appuie sur "Générer une tenue" pour commencer
            </Text>
          </View>
        ) : null}
      </Animated.View>

      {/* Weekly weather modal */}
      <Modal
        visible={showWeatherModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWeatherModal(false)}
      >
        <View style={[modalStyles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[modalStyles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[modalStyles.title, { color: theme.colors.textPrimary }]}>
              Météo de la semaine
            </Text>
            <TouchableOpacity onPress={() => setShowWeatherModal(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={modalStyles.list}>
            {daily.map((day) => (
              <View
                key={day.date}
                style={[
                  modalStyles.row,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[modalStyles.dayLabel, { color: theme.colors.textMuted }]}>
                  {day.dayLabel}
                </Text>
                <Text style={modalStyles.dayEmoji}>{day.emoji}</Text>
                <Text
                  style={[modalStyles.dayDesc, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {day.description}
                </Text>
                <Text style={[modalStyles.dayTemps, { color: theme.colors.textPrimary }]}>
                  {day.tempMax}° / {day.tempMin}°
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const OCCASION_LABELS = ['Décontracté', 'Chic', 'Soirée', 'Formel', 'Sport', 'Weekend'];
const OCCASION_SUBS = [
  'Pour la journée',
  'Pour le travail',
  'Pour ce soir',
  'Événement',
  'Activité',
  'Détente',
];

function SuggestionCard({ outfit, index }: { outfit: Outfit; index: number }) {
  const theme = useAppTheme();
  const firstItem = outfit.items?.[0];
  const cardW = SCREEN_WIDTH * 0.44;
  const [liked, setLiked] = useState(false);

  return (
    <View
      style={[
        suggStyles.card,
        { width: cardW, backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      {firstItem?.imageUrl ? (
        <Image source={{ uri: firstItem.imageUrl }} style={suggStyles.img} contentFit="cover" />
      ) : (
        <View
          style={[
            suggStyles.img,
            suggStyles.imgPlaceholder,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Ionicons name="shirt-outline" size={32} color={colors.primary[300]} />
        </View>
      )}
      <TouchableOpacity style={suggStyles.heartBtn} onPress={() => setLiked(!liked)}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={18}
          color={liked ? '#FF6B6B' : '#A0AEC0'}
        />
      </TouchableOpacity>
      <View style={suggStyles.info}>
        <Text style={[suggStyles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {OCCASION_LABELS[index % OCCASION_LABELS.length]}
        </Text>
        <Text style={[suggStyles.sub, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {OCCASION_SUBS[index % OCCASION_SUBS.length]}
        </Text>
      </View>
    </View>
  );
}

const suggStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  img: { width: '100%', aspectRatio: 3 / 4 },
  imgPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { padding: 10, gap: 2 },
  title: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  sub: { fontFamily: 'Poppins_400Regular', fontSize: 11 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing[5] },

  headerGradient: {
    marginHorizontal: -spacing[5],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    marginBottom: spacing[1],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1, gap: 4 },
  greeting: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 30,
  },
  headerSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing[3],
  },

  contextRow: { flexDirection: 'row', gap: 12, marginBottom: spacing[4] },
  contextCard: {
    flex: 1,
    borderRadius: 16,
    padding: spacing[4],
    minHeight: 110,
    borderWidth: 1,
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  contextCardLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    marginBottom: 4,
  },
  weatherMain: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weatherEmoji: { fontSize: 22 },
  weatherTemp: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  weatherDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  weatherTap: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  wardrobeCount: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    lineHeight: 40,
  },
  wardrobeSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  wardrobeIcon: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
  },

  generateBtnWrap: {
    marginBottom: spacing[6],
    borderRadius: 14,
    overflow: 'hidden',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#2563eb',
  },
  generateBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  seeAll: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.primary[500],
  },

  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    marginBottom: spacing[3],
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionCardLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  sectionCardSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 2,
  },

  suggestionsScroll: { marginLeft: -spacing[5], paddingLeft: spacing[5] },

  emptyState: { alignItems: 'center', gap: spacing[3], paddingVertical: spacing[8] },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  emptySub: { fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 18 },
  list: { padding: spacing[5], gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: 10,
  },
  dayLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    width: 36,
  },
  dayEmoji: { fontSize: 20, width: 28 },
  dayDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    flex: 1,
  },
  dayTemps: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
});

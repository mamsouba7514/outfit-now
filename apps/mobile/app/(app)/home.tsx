import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@outfit-now/design-tokens';
import type { Outfit } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '../../hooks/useAuth';
import { getOutfits } from '../../lib/briefs';
import { getDressingItems } from '../../lib/dressing';
import { getStylePassProfile, type StylePassProfile, type StyleRank } from '../../lib/stylePass';

const SCREEN_WIDTH = Dimensions.get('window').width;

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Jun',
  'Jul',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

function formatDate() {
  const d = new Date();
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`.toUpperCase();
}

// ─── Animated stat value (counts up) ────────────────────────────────────────

function AnimatedStatValue({ value, loading }: { value: number | null; loading: boolean }) {
  const animVal = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('—');

  useEffect(() => {
    if (value === null || loading) {
      setDisplay('—');
      animVal.setValue(0);
      return;
    }
    animVal.setValue(0);
    const listener = animVal.addListener(({ value: v }) => {
      setDisplay(String(Math.round(v)));
    });
    Animated.timing(animVal, { toValue: value, duration: 800, useNativeDriver: false }).start();
    return () => animVal.removeListener(listener);
  }, [value, loading]);

  return <Text style={statStyles.value}>{display}</Text>;
}
const statStyles = StyleSheet.create({
  value: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
  },
});

// ─── Score bar (animated width) ──────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 80 ? colors.primary[400] : pct >= 60 ? colors.neutral[400] : colors.neutral[600];
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct]);

  const animatedWidth = width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={scoreBarStyles.wrap}>
      <Animated.View
        style={[scoreBarStyles.fill, { width: animatedWidth, backgroundColor: color }]}
      />
    </View>
  );
}
const scoreBarStyles = StyleSheet.create({
  wrap: { height: 2, backgroundColor: colors.neutral[800], marginTop: 6 },
  fill: { height: 2 },
});

// ─── Action card with press scale ────────────────────────────────────────────

function ActionCard({
  children,
  onPress,
  tall,
}: {
  children: React.ReactNode;
  onPress: () => void;
  tall?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function onIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  }
  function onOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, tall ? styles.actionCardTall : { flex: 1 }]}>
      <TouchableOpacity
        style={[styles.actionCard, tall && styles.actionCardTallInner]}
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Style Energy widget ─────────────────────────────────────────────────────

const RANK_LABELS: Record<StyleRank, string> = {
  NOVICE: 'NOVICE',
  STYLE: 'STYLÉ·E',
  EXPERT: 'EXPERT·E',
  MAITRE: 'MAÎTRE',
  ICONE: 'ICÔNE',
};

function StyleEnergyWidget({
  profile,
  onPress,
}: {
  profile: StylePassProfile;
  onPress: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: profile.progressToNext / 100,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [profile.progressToNext]);

  return (
    <TouchableOpacity style={energyWidgetStyles.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={energyWidgetStyles.row}>
        <View style={energyWidgetStyles.left}>
          <Text style={energyWidgetStyles.label}>STYLE PASS</Text>
          <Text style={energyWidgetStyles.energy}>
            {profile.totalEnergy.toLocaleString('fr-FR')}{' '}
            <Text style={energyWidgetStyles.pts}>PTS</Text>
          </Text>
        </View>
        <View style={energyWidgetStyles.right}>
          <View style={energyWidgetStyles.rankBadge}>
            <Text style={energyWidgetStyles.rankText}>{RANK_LABELS[profile.rank]}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.primary[400]} />
        </View>
      </View>
      <View style={energyWidgetStyles.barBg}>
        <Animated.View
          style={[
            energyWidgetStyles.barFill,
            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const energyWidgetStyles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.primary[400],
    padding: spacing[3],
    borderRadius: 14,
    marginBottom: spacing[5],
    gap: spacing[2],
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { gap: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  label: { fontSize: 9, color: colors.primary[400], letterSpacing: 3 },
  energy: { fontSize: 22, fontWeight: typography.fontWeight.black, color: colors.neutral[0] },
  pts: { fontSize: 11, fontWeight: typography.fontWeight.medium, color: colors.neutral[500] },
  rankBadge: {
    backgroundColor: colors.primary[400],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 999,
  },
  rankText: {
    fontSize: 8,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[950],
    letterSpacing: 2,
  },
  barBg: { height: 3, backgroundColor: colors.neutral[800], borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, backgroundColor: colors.primary[400], borderRadius: 2 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [dressingCount, setDressingCount] = useState<number | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [stylePass, setStylePass] = useState<StylePassProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Header entrance animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const load = useCallback(async () => {
    try {
      const [dressingRes, outfitsRes, savedRes, spRes] = await Promise.all([
        getDressingItems({ pageSize: 1 }),
        getOutfits({ pageSize: 4 }),
        getOutfits({ saved: true, pageSize: 1 }),
        getStylePassProfile().catch(() => null),
      ]);
      setDressingCount(dressingRes.total);
      setOutfits(outfitsRes.data);
      setSavedCount(savedRes.total);
      setStylePass(spRes);
    } catch {
      // silently fail — stats just won't show
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const firstName = user?.firstName ?? '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'BONJOUR' : 'BONSOIR';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary[400]}
        />
      }
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] },
        ]}
      >
        <View>
          <Text style={styles.date}>{formatDate()}</Text>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{firstName.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(app)/profile')} style={styles.avatarBtn}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{firstName[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ── Gold divider ────────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <AnimatedStatValue value={dressingCount} loading={loading} />
          <Text style={styles.statLabel}>PIÈCES</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statBox}>
          <AnimatedStatValue value={outfits.length > 0 ? outfits.length : 0} loading={loading} />
          <Text style={styles.statLabel}>TENUES</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statBox}>
          <AnimatedStatValue value={savedCount} loading={loading} />
          <Text style={styles.statLabel}>SAUVÉES</Text>
        </View>
      </View>

      {/* ── Style Pass widget ──────────────────────────────────── */}
      {stylePass && (
        <StyleEnergyWidget profile={stylePass} onPress={() => router.push('/(app)/style-pass')} />
      )}

      {/* ── Quick actions ───────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>ACTIONS RAPIDES</Text>

      <View style={styles.actionsGrid}>
        <ActionCard onPress={() => router.push('/(app)/scan')} tall>
          <View style={styles.actionIconWrap}>
            <Ionicons name="camera-outline" size={28} color={colors.primary[400]} />
          </View>
          <Text style={styles.actionTitle}>SCANNER</Text>
          <Text style={styles.actionSub}>Ajoute une pièce à ton dressing</Text>
          <View style={styles.actionArrow}>
            <Ionicons name="arrow-forward" size={14} color={colors.primary[400]} />
          </View>
        </ActionCard>

        <View style={styles.actionsCol}>
          <ActionCard onPress={() => router.push('/(app)/stylist')}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="sparkles-outline" size={22} color={colors.primary[400]} />
            </View>
            <Text style={styles.actionTitle}>COMPOSER</Text>
            <Text style={styles.actionSub}>Génère une tenue IA</Text>
          </ActionCard>

          <ActionCard onPress={() => router.push('/(app)/social')}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="people-outline" size={22} color={colors.primary[400]} />
            </View>
            <Text style={styles.actionTitle}>SOCIAL</Text>
            <Text style={styles.actionSub}>Explore le style feed</Text>
          </ActionCard>

          <ActionCard onPress={() => router.push('/(app)/search')}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="search-outline" size={22} color={colors.rose?.[500] ?? '#E8194A'} />
            </View>
            <Text style={styles.actionTitle}>RECHERCHER</Text>
            <Text style={styles.actionSub}>Trouver en ligne</Text>
          </ActionCard>
        </View>
      </View>

      {/* ── Recent outfits ──────────────────────────────────────── */}
      {outfits.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>DERNIÈRES TENUES</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/outfits')} hitSlop={8}>
              <Text style={styles.seeAll}>VOIR TOUT</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.outfitsScroll}
            contentContainerStyle={{ gap: 12, paddingRight: spacing[4] }}
          >
            {outfits.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </ScrollView>
        </>
      )}

      {/* ── Empty state ──────────────────────────────────────────── */}
      {!loading && dressingCount === 0 && (
        <View style={styles.emptyBanner}>
          <Ionicons
            name="shirt-outline"
            size={36}
            color={colors.neutral[700]}
            style={{ alignSelf: 'center', marginBottom: spacing[2] }}
          />
          <Text style={styles.emptyBannerTitle}>TON DRESSING EST VIDE</Text>
          <Text style={styles.emptyBannerSub}>
            Commence par scanner ta première pièce pour que l'IA puisse composer tes tenues.
          </Text>
          <TouchableOpacity
            style={styles.emptyBannerBtn}
            onPress={() => router.push('/(app)/scan')}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyBannerBtnText}>SCANNER MA PREMIÈRE PIÈCE</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Outfit card ─────────────────────────────────────────────────────────────

function OutfitCard({ outfit }: { outfit: Outfit }) {
  const firstItem = outfit.items?.[0];
  const cardW = SCREEN_WIDTH * 0.42;
  const scale = useRef(new Animated.Value(1)).current;

  function onIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  }
  function onOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  }

  return (
    <Animated.View style={[outfitCardStyles.card, { width: cardW, transform: [{ scale }] }]}>
      <TouchableOpacity onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
        {firstItem?.imageUrl ? (
          <Image
            source={{ uri: firstItem.imageUrl }}
            style={outfitCardStyles.img}
            contentFit="cover"
          />
        ) : (
          <View style={[outfitCardStyles.img, outfitCardStyles.imgPlaceholder]}>
            <Text style={outfitCardStyles.placeholderIcon}>◈</Text>
          </View>
        )}
        <View style={outfitCardStyles.scoreBadge}>
          <Text style={outfitCardStyles.scoreText}>{outfit.score}</Text>
        </View>
        <View style={outfitCardStyles.info}>
          <Text style={outfitCardStyles.itemCount}>{outfit.items?.length ?? 0} PIÈCES</Text>
          <ScoreBar score={outfit.score} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const outfitCardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[900],
    overflow: 'hidden',
    borderRadius: 14,
  },
  img: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.neutral[900],
  },
  imgPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: { fontSize: 32, color: colors.neutral[700] },
  scoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.rose?.[500] ?? '#E8194A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.rose?.[500] ?? '#E8194A',
  },
  info: { padding: 10 },
  itemCount: {
    fontSize: 10,
    color: colors.neutral[400],
    letterSpacing: 1.5,
  },
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral[950] },
  content: { paddingHorizontal: spacing[4] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  date: { fontSize: 10, color: colors.primary[400], letterSpacing: 3, marginBottom: 6 },
  greeting: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  name: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: 3,
    lineHeight: 40,
  },
  avatarBtn: { marginTop: 4 },
  avatar: { width: 48, height: 48, borderWidth: 1, borderColor: colors.primary[400] },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.primary[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[400],
  },
  divider: {
    height: 2,
    backgroundColor: colors.rose?.[500] ?? '#E8194A',
    width: 40,
    marginBottom: spacing[5],
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[900],
    marginBottom: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: 16,
    overflow: 'hidden',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 9, color: colors.neutral[500], letterSpacing: 2 },
  statSep: { width: 1, backgroundColor: colors.neutral[800], marginVertical: 4 },
  sectionLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    letterSpacing: 3,
    marginBottom: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
    marginTop: spacing[6],
  },
  seeAll: { fontSize: 9, color: colors.primary[400], letterSpacing: 2 },
  actionsGrid: { flexDirection: 'row', gap: 10, marginBottom: spacing[2] },
  actionsCol: { flex: 1, gap: 10 },
  actionCard: {
    backgroundColor: colors.neutral[900],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    gap: 6,
    position: 'relative',
    minHeight: 100,
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionCardTall: { flex: 1 },
  actionCardTallInner: { flex: 1 },
  actionIconWrap: { marginBottom: 4 },
  actionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: 2,
  },
  actionSub: { fontSize: 10, color: colors.neutral[500], lineHeight: 14 },
  actionArrow: { position: 'absolute', bottom: spacing[3], right: spacing[3] },
  outfitsScroll: { marginLeft: -spacing[4], paddingLeft: spacing[4] },
  emptyBanner: {
    marginTop: spacing[8],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    padding: spacing[5],
    gap: spacing[3],
    alignItems: 'center',
  },
  emptyBannerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: 2,
    textAlign: 'center',
  },
  emptyBannerSub: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyBannerBtn: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    marginTop: spacing[2],
    borderRadius: 9999,
  },
  emptyBannerBtnText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[950],
    letterSpacing: 2,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@outfit-now/design-tokens';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { darkTheme } from '../../hooks/useTheme';
import {
  getStylePassProfile,
  getCurrentAward,
  getStyleCards,
  revealStyleCard,
  submitToAward,
  type StylePassProfile,
  type StyleAward,
  type StyleCard,
  type StyleRank,
} from '../../lib/stylePass';

const D = darkTheme.colors;

// ─── Constants ───────────────────────────────────────────────────────────────

const RANKS: StyleRank[] = ['NOVICE', 'STYLE', 'EXPERT', 'MAITRE', 'ICONE'];
const RANK_LABELS: Record<StyleRank, string> = {
  NOVICE: 'NOVICE',
  STYLE: 'STYLÉ·E',
  EXPERT: 'EXPERT·E',
  MAITRE: 'MAÎTRE',
  ICONE: 'ICÔNE',
};
const RANK_THRESHOLDS: Record<StyleRank, number> = {
  NOVICE: 0,
  STYLE: 1000,
  EXPERT: 5000,
  MAITRE: 20000,
  ICONE: 50000,
};
const CARD_TIER_COLORS = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: colors.primary[400],
  ICONIQUE: '#00c4bf',
};

// ─── Animated energy counter ─────────────────────────────────────────────────

function EnergyCounter({ value }: { value: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    anim.setValue(0);
    const listener = anim.addListener(({ value: v }) =>
      setDisplay(Math.round(v).toLocaleString('fr-FR')),
    );
    Animated.timing(anim, { toValue: value, duration: 1000, useNativeDriver: false }).start();
    return () => anim.removeListener(listener);
  }, [value]);

  return <Text style={styles.energyValue}>{display}</Text>;
}

// ─── Rank progress bar ───────────────────────────────────────────────────────

function RankProgressBar({ profile }: { profile: StylePassProfile }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: profile.progressToNext / 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [profile.progressToNext]);

  const currentIdx = RANKS.indexOf(profile.rank);

  return (
    <View style={styles.rankSection}>
      {/* Rank dots */}
      <View style={styles.rankDots}>
        {RANKS.map((rank, i) => {
          const active = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <View key={rank} style={styles.rankDotWrap}>
              <View
                style={[
                  styles.rankDot,
                  active && styles.rankDotActive,
                  isCurrent && styles.rankDotCurrent,
                ]}
              >
                {isCurrent && <View style={styles.rankDotInner} />}
              </View>
              <Text style={[styles.rankDotLabel, active && styles.rankDotLabelActive]}>
                {RANK_LABELS[rank]}
              </Text>
              <Text style={[styles.rankDotThreshold, active && styles.rankDotLabelActive]}>
                {RANK_THRESHOLDS[rank].toLocaleString('fr-FR')}
              </Text>
              {i < RANKS.length - 1 && (
                <View style={[styles.rankLine, i < currentIdx && styles.rankLineActive]} />
              )}
            </View>
          );
        })}
      </View>

      {/* Progress bar */}
      {profile.nextRankThreshold && (
        <View style={styles.progressBarWrap}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
          <Text style={styles.progressLabel}>
            {profile.totalEnergy.toLocaleString('fr-FR')} /{' '}
            {profile.nextRankThreshold.toLocaleString('fr-FR')} pts
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Style Card ──────────────────────────────────────────────────────────────

function StyleCardItem({ card, onReveal }: { card: StyleCard; onReveal: (id: string) => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const isExpired = new Date(card.validUntil) < new Date();
  const tierColor = CARD_TIER_COLORS[card.tier];

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  }

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }], borderColor: tierColor }]}>
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => !card.revealedAt && !isExpired && onReveal(card.id)}
        activeOpacity={1}
        disabled={!!card.revealedAt || isExpired}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardTierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.cardTierText}>{card.tier}</Text>
          </View>
          <Text style={styles.cardPartner}>{card.partner}</Text>
        </View>

        {card.revealedAt ? (
          <View style={styles.cardRevealed}>
            <Text style={[styles.cardDiscount, { color: tierColor }]}>−{card.discountPct}%</Text>
            <Text style={styles.cardPromo}>{card.promoCode}</Text>
            <Text style={styles.cardExpiry}>
              Valide jusqu'au {new Date(card.validUntil).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        ) : isExpired ? (
          <View style={styles.cardRevealed}>
            <Text style={styles.cardExpiredText}>EXPIRÉE</Text>
          </View>
        ) : (
          <View style={styles.cardUnrevealed}>
            <Text style={styles.cardScratchIcon}>◈</Text>
            <Text style={styles.cardScratchHint}>APPUIE POUR GRATTER</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const STYLE_THRESHOLD = 1000;

// ─── Award banner ─────────────────────────────────────────────────────────────

function AwardBanner({
  award,
  profile,
  onSubmitted,
}: {
  award: StyleAward;
  profile: StylePassProfile | null;
  onSubmitted: (updated: StyleAward) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const statusLabel =
    award.status === 'OPEN'
      ? 'SOUMISSIONS OUVERTES'
      : award.status === 'VOTING'
        ? 'VOTE EN COURS'
        : 'TERMINÉ';
  const statusColor =
    award.status === 'OPEN'
      ? colors.primary[400]
      : award.status === 'VOTING'
        ? '#00c4bf'
        : D.textMuted;

  const canParticipate = (profile?.totalEnergy ?? 0) >= STYLE_THRESHOLD;
  const alreadySubmitted = !!award.userSubmission;
  const isOpen = award.status === 'OPEN';

  async function handleSubmit() {
    if (!isOpen || alreadySubmitted || !canParticipate) return;
    setSubmitting(true);
    try {
      await submitToAward(award.id, { caption: award.occasion });
      onSubmitted({
        ...award,
        userSubmission: { id: '', voteCount: 0 },
        submissionCount: award.submissionCount + 1,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur. Réessaie.';
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.awardCard}>
      <View style={styles.awardHeader}>
        <View style={[styles.awardStatusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.awardStatus, { color: statusColor }]}>{statusLabel}</Text>
        <Text style={styles.awardCount}>{award.submissionCount} SOUMISSIONS</Text>
      </View>
      <Text style={styles.awardOccasion}>{award.occasion.toUpperCase()}</Text>
      <Text style={styles.awardDates}>
        {new Date(award.weekStart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}{' '}
        → {new Date(award.weekEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
      </Text>

      {alreadySubmitted ? (
        <View style={styles.awardSubmitted}>
          <Ionicons name="checkmark-circle" size={14} color={colors.primary[400]} />
          <Text style={styles.awardSubmittedText}>
            SOUMIS — {award.userSubmission!.voteCount} VOTES
          </Text>
        </View>
      ) : isOpen ? (
        !canParticipate ? (
          <View style={styles.awardLocked}>
            <Ionicons name="lock-closed" size={12} color={D.textMuted} />
            <Text style={styles.awardLockedText}>
              RANG STYLÉ·E REQUIS · {STYLE_THRESHOLD.toLocaleString('fr-FR')} PTS MIN
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.awardSubmitBtn}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={D.background} />
            ) : (
              <Text style={styles.awardSubmitBtnText}>PARTICIPER →</Text>
            )}
          </TouchableOpacity>
        )
      ) : null}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function StylePassScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [profile, setProfile] = useState<StylePassProfile | null>(null);
  const [award, setAward] = useState<StyleAward | null>(null);
  const [cards, setCards] = useState<StyleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([getStylePassProfile(), getStyleCards()]);
      setProfile(p);
      setCards(c);
      try {
        const a = await getCurrentAward();
        setAward(a);
      } catch {
        // No award this week
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const onReveal = useCallback(async (cardId: string) => {
    try {
      const updated = await revealStyleCard(cardId);
      setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    } catch {
      // already revealed or expired
    }
  }, []);

  const unrevealedCards = cards.filter(
    (c) => !c.revealedAt && new Date(c.validUntil) >= new Date(),
  );
  const revealedCards = cards.filter((c) => c.revealedAt);

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
      {/* ── Header ─────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={D.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STYLE PASS</Text>
        <View style={{ width: 22 }} />
      </Animated.View>

      <View style={styles.divider} />

      {/* ── Energy block ───────────────────────────────────────────── */}
      {profile && (
        <View style={styles.energyBlock}>
          <Text style={styles.energyLabel}>STYLE ENERGY</Text>
          <EnergyCounter value={profile.totalEnergy} />
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>{RANK_LABELS[profile.rank]}</Text>
          </View>
          {profile.streakDays > 0 && (
            <View style={styles.streak}>
              <Ionicons name="flame" size={14} color={colors.primary[500]} />
              <Text style={styles.streakText}>{profile.streakDays} JOURS DE SUITE</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Rank progress ──────────────────────────────────────────── */}
      {profile && (
        <>
          <Text style={styles.sectionLabel}>PROGRESSION</Text>
          <RankProgressBar profile={profile} />
        </>
      )}

      {/* ── Style Awards ───────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>STYLE AWARDS</Text>
      </View>

      {award ? (
        <AwardBanner award={award} profile={profile} onSubmitted={setAward} />
      ) : !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>AUCUN AWARD CETTE SEMAINE</Text>
        </View>
      ) : null}

      {/* ── Style Cards ────────────────────────────────────────────── */}
      {unrevealedCards.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: spacing[6] }]}>
            CARTES À GRATTER ({unrevealedCards.length})
          </Text>
          {unrevealedCards.map((card) => (
            <StyleCardItem key={card.id} card={card} onReveal={onReveal} />
          ))}
        </>
      )}

      {revealedCards.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: spacing[6] }]}>CARTES RÉVÉLÉES</Text>
          {revealedCards.map((card) => (
            <StyleCardItem key={card.id} card={card} onReveal={onReveal} />
          ))}
        </>
      )}

      {!loading && cards.length === 0 && (
        <View style={[styles.emptyState, { marginTop: spacing[4] }]}>
          <Ionicons
            name="card-outline"
            size={32}
            color={D.textMuted}
            style={{ marginBottom: spacing[2] }}
          />
          <Text style={styles.emptyStateText}>PAS ENCORE DE STYLE CARD</Text>
          <Text style={styles.emptyStateSub}>
            Participe aux Style Awards pour gagner des remises exclusives chez nos partenaires.
          </Text>
        </View>
      )}

      {/* ── How it works ───────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { marginTop: spacing[8] }]}>
        COMMENT GAGNER DE L'ÉNERGIE
      </Text>
      <View style={styles.howItWorksCard}>
        {[
          { icon: 'camera-outline', label: 'Scanner une pièce', pts: '+10 pts' },
          { icon: 'sparkles-outline', label: 'Créer un brief', pts: '+20 pts' },
          { icon: 'shirt-outline', label: 'Confirmer un port', pts: '+15 pts' },
          { icon: 'thumbs-up-outline', label: 'Voter dans la communauté', pts: '+5 pts' },
          { icon: 'trophy-outline', label: 'Soumettre aux Awards', pts: '+25 pts' },
        ].map(({ icon, label, pts }) => (
          <View key={label} style={styles.howItWorksRow}>
            <Ionicons name={icon as never} size={18} color={colors.primary[400]} />
            <Text style={styles.howItWorksLabel}>{label}</Text>
            <Text style={styles.howItWorksPts}>{pts}</Text>
          </View>
        ))}
        <Text style={styles.howItWorksNote}>
          Aucun achat ne donne d'énergie. Le rang se mérite par l'usage du dressing.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.background },
  content: { paddingHorizontal: spacing[4] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeight.black,
    color: D.textPrimary,
    letterSpacing: 4,
  },
  divider: { height: 2, backgroundColor: colors.primary[400], width: 40, marginBottom: spacing[5] },

  energyBlock: { alignItems: 'center', marginBottom: spacing[6], gap: spacing[2] },
  energyLabel: { fontSize: 10, color: D.textMuted, letterSpacing: 4 },
  energyValue: {
    fontSize: 52,
    fontWeight: typography.fontWeight.black,
    color: D.textPrimary,
    lineHeight: 60,
  },
  rankBadge: {
    backgroundColor: colors.primary[400],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderRadius: 999,
    marginTop: spacing[1],
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.black,
    color: D.background,
    letterSpacing: 3,
  },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing[1] },
  streakText: {
    fontSize: 10,
    color: '#00c4bf',
    letterSpacing: 2,
    fontWeight: typography.fontWeight.bold,
  },

  sectionLabel: {
    fontSize: 10,
    color: D.textMuted,
    letterSpacing: 3,
    marginBottom: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },

  rankSection: { marginBottom: spacing[6] },
  rankDots: { flexDirection: 'row', justifyContent: 'space-between', position: 'relative' },
  rankDotWrap: { alignItems: 'center', flex: 1, position: 'relative' },
  rankDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: D.border,
    borderWidth: 1,
    borderColor: D.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankDotActive: { backgroundColor: colors.primary[400], borderColor: colors.primary[400] },
  rankDotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: D.background,
    borderColor: colors.primary[400],
    borderWidth: 2,
  },
  rankDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary[400] },
  rankDotLabel: { fontSize: 7, color: D.textMuted, letterSpacing: 1, textAlign: 'center' },
  rankDotLabelActive: { color: D.textSecondary },
  rankDotThreshold: { fontSize: 7, color: D.textMuted, textAlign: 'center' },
  rankLine: {
    position: 'absolute',
    top: 5,
    left: '50%',
    right: '-50%',
    height: 1,
    backgroundColor: D.border,
  },
  rankLineActive: { backgroundColor: colors.primary[400] },

  progressBarWrap: {
    height: 4,
    backgroundColor: D.border,
    borderRadius: 2,
    marginTop: spacing[4],
    overflow: 'hidden',
  },
  progressBarFill: { height: 4, backgroundColor: colors.primary[400], borderRadius: 2 },
  progressLabel: {
    fontSize: 9,
    color: D.textMuted,
    letterSpacing: 1,
    textAlign: 'right',
    marginTop: 4,
  },

  awardCard: {
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.border,
    padding: spacing[4],
    borderRadius: 16,
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  awardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  awardStatusDot: { width: 6, height: 6, borderRadius: 3 },
  awardStatus: { fontSize: 9, fontWeight: typography.fontWeight.bold, letterSpacing: 2, flex: 1 },
  awardCount: { fontSize: 9, color: D.textMuted, letterSpacing: 1 },
  awardOccasion: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: D.textPrimary,
    letterSpacing: 2,
  },
  awardDates: { fontSize: 10, color: D.textMuted, letterSpacing: 1 },
  awardSubmitted: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing[1] },
  awardSubmittedText: {
    fontSize: 9,
    color: colors.primary[400],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.bold,
  },
  awardLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: D.surfaceAlt,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  awardLockedText: {
    fontSize: 9,
    color: D.textMuted,
    letterSpacing: 2,
    fontWeight: typography.fontWeight.bold,
  },
  awardSubmitBtn: {
    marginTop: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.primary[400],
    borderRadius: 8,
    alignSelf: 'flex-start',
    minWidth: 100,
    alignItems: 'center',
  },
  awardSubmitBtnText: {
    fontSize: 10,
    color: D.background,
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },

  card: {
    backgroundColor: D.surface,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  cardTierBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 4 },
  cardTierText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.black,
    color: D.background,
    letterSpacing: 2,
  },
  cardPartner: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: D.textPrimary,
    letterSpacing: 1,
  },
  cardRevealed: { alignItems: 'center', gap: spacing[2] },
  cardDiscount: { fontSize: 40, fontWeight: typography.fontWeight.black, lineHeight: 44 },
  cardPromo: {
    fontSize: 16,
    fontWeight: typography.fontWeight.black,
    color: D.textPrimary,
    letterSpacing: 4,
    backgroundColor: D.surfaceAlt,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 8,
  },
  cardExpiry: { fontSize: 10, color: D.textMuted, letterSpacing: 1 },
  cardExpiredText: { fontSize: 12, color: D.textMuted, letterSpacing: 3 },
  cardUnrevealed: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[4] },
  cardScratchIcon: { fontSize: 36, color: D.textMuted },
  cardScratchHint: { fontSize: 10, color: D.textMuted, letterSpacing: 3 },

  howItWorksCard: {
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.border,
    padding: spacing[4],
    borderRadius: 16,
    gap: spacing[3],
  },
  howItWorksRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  howItWorksLabel: { flex: 1, fontSize: 12, color: D.textSecondary, letterSpacing: 0.5 },
  howItWorksPts: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[400],
    letterSpacing: 1,
  },
  howItWorksNote: {
    fontSize: 10,
    color: D.textMuted,
    lineHeight: 16,
    marginTop: spacing[2],
    fontStyle: 'italic',
  },

  emptyState: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[4] },
  emptyStateText: { fontSize: 11, color: D.textMuted, letterSpacing: 3 },
  emptyStateSub: { fontSize: 11, color: D.textMuted, textAlign: 'center', lineHeight: 16 },
});

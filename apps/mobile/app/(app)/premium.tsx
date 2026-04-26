import { colors, typography, spacing } from '@outfit-now/design-tokens';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';

import { useSubscription } from '../../hooks/useSubscription';
import { track } from '../../lib/analytics';

const PERKS = [
  { label: 'Briefs illimités',       sub: 'Sans limite quotidienne',                   icon: '∞' },
  { label: 'Dressing illimité',      sub: 'Plus de limite à 50 pièces',                icon: '◈' },
  { label: 'Essayage virtuel IA',    sub: 'Visualise chaque tenue sur ton mannequin',  icon: '◉' },
  { label: 'Composition prioritaire',sub: "File d'attente dédiée",                     icon: '⚡' },
  { label: "Score d'usage avancé",   sub: 'Alertes pièces non portées',                icon: '◎' },
  { label: 'Export PDF',             sub: 'Ton dressing en document',                  icon: '↗' },
];

const COMPARE = [
  { label: 'Briefs / jour',    free: '3',   premium: '∞' },
  { label: 'Pièces dressing',  free: '50',  premium: '∞' },
  { label: 'Essayage virtuel', free: '✕',   premium: '✓' },
  { label: 'Shopping IA',      free: '✕',   premium: '✓' },
  { label: 'Export PDF',       free: '✕',   premium: '✓' },
];

export default function PremiumScreen() {
  const router   = useRouter();
  const { isPremium, isLoading, offering, purchase, restore } = useSubscription();

  useEffect(() => { track.premiumPaywallViewed(); }, []);

  // ── Purchase ──────────────────────────────────────────────────────────────
  async function handlePurchase(packageType: 'monthly' | 'annual') {
    if (!offering) {
      Alert.alert('Indisponible', 'Les offres ne sont pas disponibles pour l\'instant.');
      return;
    }

    const pkg = packageType === 'monthly'
      ? offering.monthly
      : offering.annual;

    if (!pkg) {
      Alert.alert('Indisponible', 'Ce forfait n\'est pas disponible.');
      return;
    }

    track.premiumCheckoutStarted();
    const result = await purchase(pkg);

    if (result.success) {
      Alert.alert('Bienvenue ✦', 'Tu es maintenant membre Premium !');
    } else if (!result.cancelled) {
      Alert.alert('Erreur', result.error ?? 'Achat impossible. Réessaie.');
    }
  }

  // ── Restore ───────────────────────────────────────────────────────────────
  async function handleRestore() {
    const ok = await restore();
    if (ok) {
      Alert.alert('Restauré ✓', 'Ton abonnement a été restauré.');
    } else {
      Alert.alert('Aucun achat', 'Aucun abonnement actif trouvé sur ce compte.');
    }
  }

  // ── Prices from RevenueCat ─────────────────────────────────────────────────
  const monthlyPkg  = offering?.monthly;
  const annualPkg   = offering?.annual;
  const monthlyPrice = monthlyPkg?.product.priceString ?? '9,99 €';
  const annualPrice  = annualPkg?.product.priceString  ?? '79,99 €';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>
          {isPremium ? 'MEMBRE ACTIF' : 'DÉBLOQUER'}
        </Text>
        <Text style={styles.heroTitle}>
          {isPremium ? 'Premium' : 'Passe à\nPremium'}
        </Text>
        <View style={styles.heroDivider} />
        <Text style={styles.heroSub}>
          {isPremium
            ? 'Tu bénéficies de tous les avantages exclusifs.'
            : 'Compose des tenues sans limites depuis ton dressing.'}
        </Text>
      </View>

      {/* ── Plans (non-premium only) ──────────────────────────────────────── */}
      {!isPremium && (
        <View style={styles.plansRow}>
          {/* Monthly */}
          <TouchableOpacity
            style={styles.planCard}
            onPress={() => handlePurchase('monthly')}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <Text style={styles.planPeriod}>MENSUEL</Text>
            <Text style={styles.planPrice}>{monthlyPrice}</Text>
            <Text style={styles.planSub}>/ mois · sans engagement</Text>
          </TouchableOpacity>

          {/* Annual — highlighted */}
          <TouchableOpacity
            style={[styles.planCard, styles.planCardAnnual]}
            onPress={() => handlePurchase('annual')}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>-33%</Text>
            </View>
            <Text style={[styles.planPeriod, styles.planPeriodAnnual]}>ANNUEL</Text>
            <Text style={[styles.planPrice, styles.planPriceAnnual]}>{annualPrice}</Text>
            <Text style={[styles.planSub, styles.planSubAnnual]}>/ an · économise 40 €</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Perks ─────────────────────────────────────────────────────────── */}
      <View style={styles.perksBlock}>
        {PERKS.map((perk, i) => (
          <View
            key={perk.label}
            style={[styles.perkRow, i < PERKS.length - 1 && styles.perkRowBorder]}
          >
            <Text style={styles.perkIcon}>{perk.icon}</Text>
            <View style={styles.perkText}>
              <Text style={styles.perkLabel}>{perk.label}</Text>
              <Text style={styles.perkSub}>{perk.sub}</Text>
            </View>
            {isPremium && <Text style={styles.checkmark}>✓</Text>}
          </View>
        ))}
      </View>

      {/* ── Compare table (non-premium only) ─────────────────────────────── */}
      {!isPremium && (
        <View style={styles.compareBlock}>
          <View style={[styles.compareRow, styles.compareHeader]}>
            <Text style={[styles.compareFeature, styles.compareHeaderText]}>FONCTIONNALITÉ</Text>
            <Text style={styles.compareFreeHeader}>GRATUIT</Text>
            <Text style={styles.comparePremiumHeader}>PREMIUM</Text>
          </View>
          {COMPARE.map((row) => (
            <View key={row.label} style={styles.compareRow}>
              <Text style={styles.compareFeature}>{row.label}</Text>
              <Text style={styles.compareFree}>{row.free}</Text>
              <Text style={styles.comparePremium}>{row.premium}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary[400]} style={{ marginVertical: spacing[4] }} />
      ) : isPremium ? (
        <View style={styles.activeBlock}>
          <Text style={styles.activeText}>✦  Abonnement actif</Text>
          <Text style={styles.activeSub}>Gérable depuis les Réglages de l'App Store</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={() => handlePurchase('monthly')}
          activeOpacity={0.85}
        >
          <Text style={styles.upgradeBtnText}>COMMENCER — {monthlyPrice}/MOIS</Text>
        </TouchableOpacity>
      )}

      {/* ── Restore ───────────────────────────────────────────────────────── */}
      {!isPremium && (
        <TouchableOpacity onPress={handleRestore} activeOpacity={0.7}>
          <Text style={styles.restoreText}>Restaurer mes achats</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.legal}>
        L'abonnement se renouvelle automatiquement. Annulable depuis les Réglages
        de l'App Store à tout moment. Paiements sécurisés par Apple.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[12],
    gap: spacing[6],
  },
  closeBtn: {
    position: 'absolute',
    top: spacing[16],
    right: spacing[6],
    zIndex: 10,
    padding: spacing[3],
  },
  closeBtnText: { fontSize: typography.fontSize.base, color: colors.neutral[500] },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroBlock: { gap: spacing[3], paddingRight: spacing[10] },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    letterSpacing: 4,
    fontWeight: typography.fontWeight.black,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
    lineHeight: 50,
  },
  heroDivider: { width: 32, height: 1, backgroundColor: colors.primary[600] },
  heroSub: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    lineHeight: 24,
  },

  // ── Plans ─────────────────────────────────────────────────────────────────
  plansRow: { flexDirection: 'row', gap: spacing[3] },
  planCard: {
    flex: 1,
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    padding: spacing[4],
    gap: spacing[1],
    alignItems: 'center',
  },
  planCardAnnual: {
    borderColor: colors.primary[600],
    backgroundColor: '#1A0F00',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  planBadgeText: {
    fontSize: 9,
    color: colors.neutral[950],
    fontWeight: typography.fontWeight.black,
    letterSpacing: 1,
  },
  planPeriod: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
    marginTop: spacing[2],
  },
  planPeriodAnnual: { color: colors.primary[500] },
  planPrice: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
  },
  planPriceAnnual: { color: colors.primary[400] },
  planSub: {
    fontSize: 10,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  planSubAnnual: { color: colors.primary[800] },

  // ── Perks ─────────────────────────────────────────────────────────────────
  perksBlock: { borderWidth: 1, borderColor: colors.neutral[800] },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  perkRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.neutral[900] },
  perkIcon: {
    fontSize: 16,
    color: colors.primary[500],
    width: 24,
    textAlign: 'center',
    fontWeight: typography.fontWeight.bold,
  },
  perkText: { flex: 1, gap: 2 },
  perkLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[200],
  },
  perkSub: { fontSize: typography.fontSize.xs, color: colors.neutral[600] },
  checkmark: {
    fontSize: typography.fontSize.base,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.bold,
  },

  // ── Compare ───────────────────────────────────────────────────────────────
  compareBlock: { borderWidth: 1, borderColor: colors.neutral[800] },
  compareRow: {
    flexDirection: 'row',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
    alignItems: 'center',
  },
  compareHeader: { backgroundColor: colors.neutral[900] },
  compareHeaderText: { color: colors.neutral[600], letterSpacing: 1 },
  compareFeature: { flex: 1, fontSize: typography.fontSize.xs, color: colors.neutral[500], letterSpacing: 0.5 },
  compareFreeHeader: { width: 64, fontSize: 9, color: colors.neutral[600], textAlign: 'center', letterSpacing: 1.5 },
  comparePremiumHeader: { width: 64, fontSize: 9, color: colors.primary[400], textAlign: 'center', letterSpacing: 1.5, fontWeight: typography.fontWeight.black },
  compareFree: { width: 64, fontSize: typography.fontSize.sm, color: colors.neutral[700], textAlign: 'center' },
  comparePremium: { width: 64, fontSize: typography.fontSize.sm, color: colors.primary[400], textAlign: 'center', fontWeight: typography.fontWeight.bold },

  // ── CTA ───────────────────────────────────────────────────────────────────
  upgradeBtn: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[5],
    alignItems: 'center',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  upgradeBtnText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 2,
  },
  activeBlock: {
    borderWidth: 1,
    borderColor: colors.primary[700],
    padding: spacing[5],
    alignItems: 'center',
    gap: spacing[1],
  },
  activeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  activeSub: { fontSize: typography.fontSize.xs, color: colors.neutral[600] },
  restoreText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    textAlign: 'center',
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
  legal: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[700],
    textAlign: 'center',
    lineHeight: 18,
  },
});

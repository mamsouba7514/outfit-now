import { colors, typography, spacing } from '@outfit-now/design-tokens';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';

import { useAuthStore } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';

const SECTION_GAP = spacing[6];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isPremium, restore } = useSubscription();

  async function handleLogout() {
    Alert.alert('Se déconnecter', 'Confirmer la déconnexion ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]);
  }

  async function handleRestore() {
    const ok = await restore();
    if (ok) {
      Alert.alert('Restauré ✓', 'Ton abonnement Premium a été restauré.');
    } else {
      Alert.alert('Aucun achat', 'Aucun abonnement actif trouvé sur ce compte App Store.');
    }
  }

  function handlePrivacy() {
    void Linking.openURL('https://outfitnow.app/privacy');
  }

  function handleTerms() {
    void Linking.openURL('https://outfitnow.app/terms');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← RETOUR</Text>
        </TouchableOpacity>
        <Text style={styles.title}>RÉGLAGES</Text>
      </View>

      {/* ── Compte ────────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>COMPTE</Text>
        <View style={styles.card}>
          <Row label="Email" value={user?.email ?? '—'} />
          <RowDivider />
          <Row label="Prénom" value={user?.firstName ?? '—'} />
          <RowDivider />
          <Row label="Nom" value={user?.lastName ?? '—'} />
        </View>
      </View>

      {/* ── Abonnement ────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ABONNEMENT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Plan actuel</Text>
            <View style={[styles.tierBadge, isPremium && styles.tierBadgePremium]}>
              <Text style={[styles.tierBadgeText, isPremium && styles.tierBadgeTextPremium]}>
                {isPremium ? '✦ PREMIUM' : 'GRATUIT'}
              </Text>
            </View>
          </View>
          <RowDivider />
          {!isPremium ? (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/(app)/premium' as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.rowLabelAction}>Passer à Premium</Text>
              <Text style={styles.rowChevron}>→</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Gérable depuis l'App Store</Text>
            </View>
          )}
          <RowDivider />
          <TouchableOpacity style={styles.row} onPress={handleRestore} activeOpacity={0.7}>
            <Text style={styles.rowLabel}>Restaurer mes achats</Text>
            <Text style={styles.rowChevron}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Préférences ───────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PRÉFÉRENCES</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/(app)/profile' as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Modifier mon profil</Text>
            <Text style={styles.rowChevron}>→</Text>
          </TouchableOpacity>
          <RowDivider />
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/(app)/avatar' as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Mon mannequin virtuel</Text>
            <Text style={styles.rowChevron}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Légal ─────────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LÉGAL</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handlePrivacy} activeOpacity={0.7}>
            <Text style={styles.rowLabel}>Politique de confidentialité</Text>
            <Text style={styles.rowChevron}>↗</Text>
          </TouchableOpacity>
          <RowDivider />
          <TouchableOpacity style={styles.row} onPress={handleTerms} activeOpacity={0.7}>
            <Text style={styles.rowLabel}>Conditions d'utilisation</Text>
            <Text style={styles.rowChevron}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Déconnexion ───────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>SE DÉCONNECTER</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Outfit Now · v1.0.0</Text>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  content: {
    paddingBottom: spacing[16],
    gap: SECTION_GAP,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
    gap: spacing[2],
  },
  backBtn: { marginBottom: spacing[1] },
  backText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
    letterSpacing: -0.5,
  },

  // ── Section ───────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  sectionLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
  },
  card: {
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },

  // ── Row ───────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.neutral[800],
    marginHorizontal: spacing[5],
  },
  rowLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    flex: 1,
  },
  rowLabelAction: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[200],
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  rowValue: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[200],
    fontWeight: typography.fontWeight.medium,
    maxWidth: '55%',
    textAlign: 'right',
  },
  rowChevron: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
  },

  // ── Tier badge ────────────────────────────────────────────────────────────
  tierBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  tierBadgePremium: {
    borderColor: colors.primary[600],
    backgroundColor: '#1A0F00',
  },
  tierBadgeText: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },
  tierBadgeTextPremium: {
    color: colors.primary[400],
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#3D1010',
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  logoutText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },

  version: {
    fontSize: 10,
    color: colors.neutral[800],
    textAlign: 'center',
    letterSpacing: 1,
    paddingBottom: spacing[4],
  },
});

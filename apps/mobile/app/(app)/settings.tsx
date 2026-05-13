import { spacing } from '@outfit-now/design-tokens';
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
  Switch,
} from 'react-native';

import { useAppTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';

const SECTION_GAP = spacing[6];

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
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

  const s = makeStyles(theme);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <StatusBar barStyle={theme.colors.statusBar} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← RETOUR</Text>
        </TouchableOpacity>
        <Text style={s.title}>RÉGLAGES</Text>
      </View>

      {/* ── Compte ────────────────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>COMPTE</Text>
        <View style={s.card}>
          <Row label="Email" value={user?.email ?? '—'} theme={theme} />
          <RowDivider theme={theme} />
          <Row label="Prénom" value={user?.firstName ?? '—'} theme={theme} />
          <RowDivider theme={theme} />
          <Row label="Nom" value={user?.lastName ?? '—'} theme={theme} />
        </View>
      </View>

      {/* ── Abonnement ────────────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>ABONNEMENT</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Plan actuel</Text>
            <View style={[s.tierBadge, isPremium && s.tierBadgePremium]}>
              <Text style={[s.tierBadgeText, isPremium && s.tierBadgeTextPremium]}>
                {isPremium ? '✦ PREMIUM' : 'GRATUIT'}
              </Text>
            </View>
          </View>
          <RowDivider theme={theme} />
          {!isPremium ? (
            <TouchableOpacity
              style={s.row}
              onPress={() => router.push('/(app)/premium' as never)}
              activeOpacity={0.7}
            >
              <Text style={s.rowLabelAction}>Passer à Premium</Text>
              <Text style={s.rowChevron}>→</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.row}>
              <Text style={s.rowLabel}>Gérable depuis l'App Store</Text>
            </View>
          )}
          <RowDivider theme={theme} />
          <TouchableOpacity style={s.row} onPress={handleRestore} activeOpacity={0.7}>
            <Text style={s.rowLabel}>Restaurer mes achats</Text>
            <Text style={s.rowChevron}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Préférences ───────────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>PRÉFÉRENCES</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={s.row}
            onPress={() => router.push('/(app)/profile' as never)}
            activeOpacity={0.7}
          >
            <Text style={s.rowLabel}>Modifier mon profil</Text>
            <Text style={s.rowChevron}>→</Text>
          </TouchableOpacity>
          <RowDivider theme={theme} />
          <TouchableOpacity
            style={s.row}
            onPress={() => router.push('/(app)/avatar' as never)}
            activeOpacity={0.7}
          >
            <Text style={s.rowLabel}>Mon mannequin virtuel</Text>
            <Text style={s.rowChevron}>→</Text>
          </TouchableOpacity>
          <RowDivider theme={theme} />
          <View style={s.row}>
            <Text style={s.rowLabel}>Mode sombre</Text>
            <Switch
              value={theme.dark}
              onValueChange={theme.toggle}
              trackColor={{ false: '#e2e8f0', true: '#00C4BF' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </View>

      {/* ── Légal ─────────────────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>LÉGAL</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={handlePrivacy} activeOpacity={0.7}>
            <Text style={s.rowLabel}>Politique de confidentialité</Text>
            <Text style={s.rowChevron}>↗</Text>
          </TouchableOpacity>
          <RowDivider theme={theme} />
          <TouchableOpacity style={s.row} onPress={handleTerms} activeOpacity={0.7}>
            <Text style={s.rowLabel}>Conditions d'utilisation</Text>
            <Text style={s.rowChevron}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Déconnexion ───────────────────────────────────────────────────── */}
      <View style={s.section}>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={s.logoutText}>SE DÉCONNECTER</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.version}>Outfit Now · v1.0.0</Text>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const s = makeStyles(theme);
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function RowDivider({ theme }: { theme: ReturnType<typeof useAppTheme> }) {
  return (
    <View
      style={{ height: 1, backgroundColor: theme.colors.border, marginHorizontal: spacing[5] }}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: {
      paddingBottom: spacing[16],
      gap: SECTION_GAP,
    },

    header: {
      paddingHorizontal: spacing[6],
      paddingTop: spacing[16],
      paddingBottom: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: spacing[2],
    },
    backBtn: { marginBottom: spacing[1] },
    backText: {
      fontSize: 11,
      color: '#00C4BF',
      letterSpacing: 2,
      fontFamily: 'Poppins_700Bold',
    },
    title: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 28,
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
    },

    section: {
      paddingHorizontal: spacing[6],
      gap: spacing[3],
    },
    sectionLabel: {
      fontSize: 9,
      color: theme.colors.textMuted,
      letterSpacing: 3,
      fontFamily: 'Poppins_700Bold',
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[4],
    },
    rowLabel: {
      fontSize: 14,
      color: theme.colors.textMuted,
      fontFamily: 'Poppins_400Regular',
      flex: 1,
    },
    rowLabelAction: {
      fontSize: 14,
      color: theme.colors.textPrimary,
      fontFamily: 'Poppins_500Medium',
      flex: 1,
    },
    rowValue: {
      fontSize: 14,
      color: theme.colors.textPrimary,
      fontFamily: 'Poppins_500Medium',
      maxWidth: '55%',
      textAlign: 'right',
    },
    rowChevron: {
      fontSize: 14,
      color: '#00C4BF',
      fontFamily: 'Poppins_700Bold',
    },

    tierBadge: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 4,
    },
    tierBadgePremium: {
      borderColor: '#00C4BF',
      backgroundColor: 'rgba(0,196,191,0.08)',
    },
    tierBadgeText: {
      fontSize: 9,
      color: theme.colors.textMuted,
      letterSpacing: 2,
      fontFamily: 'Poppins_700Bold',
    },
    tierBadgeTextPremium: {
      color: '#00C4BF',
    },

    logoutBtn: {
      borderWidth: 1,
      borderColor: 'rgba(255,107,107,0.3)',
      borderRadius: 12,
      paddingVertical: spacing[4],
      alignItems: 'center',
    },
    logoutText: {
      fontSize: 11,
      color: '#FF6B6B',
      letterSpacing: 2,
      fontFamily: 'Poppins_700Bold',
    },

    version: {
      fontSize: 10,
      color: theme.colors.textMuted,
      textAlign: 'center',
      letterSpacing: 1,
      paddingBottom: spacing[4],
      fontFamily: 'Poppins_400Regular',
    },
  });
}

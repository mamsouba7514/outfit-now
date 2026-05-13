import { spacing } from '@outfit-now/design-tokens';
import type { Gender } from '@outfit-now/shared-types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

import { useAppTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../hooks/useAuth';
import { updateMe, requestExport, deleteAccount } from '../../lib/auth';

const STYLE_TAGS = [
  'Minimaliste',
  'Casual',
  'Classique',
  'Sportswear',
  'Bohème',
  'Urbain',
  'Chic',
  'Vintage',
  'Streetwear',
  'Business',
];

const GENDER_OPTIONS: { label: string; value: Gender; sub: string }[] = [
  { label: 'Homme', value: 'male', sub: 'Mode masculine' },
  { label: 'Femme', value: 'female', sub: 'Mode féminine' },
  { label: 'Non-binaire', value: 'non_binary', sub: 'Mode inclusive' },
  { label: 'Non précisé', value: 'prefer_not_to_say', sub: 'Toutes suggestions' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user, logout, refresh } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [stylePref, setStylePref] = useState<string[]>(user?.stylePreferences ?? []);
  const [saving, setSaving] = useState(false);

  function toggleStyle(tag: string) {
    setStylePref((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateMe({
        firstName,
        lastName,
        gender: gender ?? undefined,
        stylePreferences: stylePref,
      });
      await refresh();
      setEditing(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessaie.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    Alert.alert('Exporter mes données', 'Tu recevras un email avec tes données dans les 24h.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          try {
            await requestExport();
            Alert.alert('Demande envoyée', 'Tu recevras un email sous 24h.');
          } catch {
            Alert.alert('Erreur', 'Réessaie plus tard.');
          }
        },
      },
    ]);
  }

  async function handleDelete() {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes tes données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              await logout();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer. Contacte le support.');
            }
          },
        },
      ],
    );
  }

  async function handleLogout() {
    Alert.alert('Se déconnecter', 'Confirmer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]);
  }

  const genderLabel = GENDER_OPTIONS.find((g) => g.value === user?.gender)?.label ?? '—';
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <StatusBar barStyle={theme.colors.statusBar} />

      <View style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Mon profil</Text>
          <View style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'center' }}>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Modifier</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push('/(app)/settings' as never)}
              style={[
                styles.settingsBtn,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.settingsBtnText, { color: theme.colors.textMuted }]}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Avatar */}
      <View
        style={[
          styles.avatarRow,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <View style={styles.avatarInfo}>
          <Text style={[styles.avatarName, { color: theme.colors.textPrimary }]}>
            {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Mon compte'}
          </Text>
          <Text style={[styles.avatarEmail, { color: theme.colors.textMuted }]}>
            {user?.email ?? ''}
          </Text>
        </View>
      </View>

      {/* Infos */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>INFORMATIONS</Text>
        {editing ? (
          <>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>PRÉNOM</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Jean"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardAppearance={theme.dark ? 'dark' : 'light'}
                />
                <View style={[styles.inputLine, { backgroundColor: theme.colors.border }]} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>NOM</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Dupont"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardAppearance={theme.dark ? 'dark' : 'light'}
                />
                <View style={[styles.inputLine, { backgroundColor: theme.colors.border }]} />
              </View>
            </View>
            <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>GENRE</Text>
            <View style={styles.genderGrid}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.genderCard,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                    gender === opt.value && styles.genderCardActive,
                  ]}
                  onPress={() => setGender(opt.value)}
                >
                  <Text
                    style={[
                      styles.genderLabel,
                      { color: theme.colors.textPrimary },
                      gender === opt.value && styles.genderLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={[
                      styles.genderSub,
                      { color: theme.colors.textMuted },
                      gender === opt.value && styles.genderSubActive,
                    ]}
                  >
                    {opt.sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Row label="PRÉNOM" value={user?.firstName} />
            <Row label="NOM" value={user?.lastName} />
            <Row label="EMAIL" value={user?.email} />
            <Row label="GENRE" value={genderLabel} />
          </>
        )}
      </View>

      {/* Abonnement */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>ABONNEMENT</Text>
        <View style={styles.planRow}>
          <View>
            <Text style={[styles.planName, { color: theme.colors.textPrimary }]}>
              {user?.tier === 'premium' ? 'PREMIUM' : 'GRATUIT'}
            </Text>
            <Text style={[styles.planSub, { color: theme.colors.textMuted }]}>
              {user?.tier === 'premium'
                ? 'Briefs illimités · Dressing illimité'
                : '3 briefs/jour · 50 pièces max'}
            </Text>
          </View>
          {user?.tier !== 'premium' && (
            <TouchableOpacity
              onPress={() => router.push('/(app)/premium' as never)}
              style={styles.upgradeBtn}
            >
              <Text style={styles.upgradeBtnText}>PREMIUM →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Style préférences */}
      {editing ? (
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
            STYLES PRÉFÉRÉS
          </Text>
          <View style={styles.tagsGrid}>
            {STYLE_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  stylePref.includes(tag) && styles.tagActive,
                ]}
                onPress={() => toggleStyle(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: theme.colors.textMuted },
                    stylePref.includes(tag) && styles.tagTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (user?.stylePreferences?.length ?? 0) > 0 ? (
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
            STYLES PRÉFÉRÉS
          </Text>
          <View style={styles.tagsGrid}>
            {(user?.stylePreferences ?? []).map((tag) => (
              <View key={tag} style={[styles.tag, styles.tagActive]}>
                <Text style={[styles.tagText, styles.tagTextActive]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Boutons édition */}
      {editing && (
        <View style={styles.editActions}>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>ENREGISTRER</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              setFirstName(user?.firstName ?? '');
              setLastName(user?.lastName ?? '');
              setGender(user?.gender ?? null);
              setStylePref(user?.stylePreferences ?? []);
              setEditing(false);
            }}
          >
            <Text style={[styles.cancelBtnText, { color: theme.colors.textMuted }]}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Style Pass */}
      <TouchableOpacity
        style={styles.stylePassBanner}
        onPress={() => router.push('/(app)/style-pass' as never)}
        activeOpacity={0.8}
      >
        <View>
          <Text style={styles.stylePassLabel}>🏆 STYLE PASS</Text>
          <Text style={styles.stylePassSub}>Classement · Récompenses · Défis</Text>
        </View>
        <Text style={styles.stylePassArrow}>→</Text>
      </TouchableOpacity>

      {/* Mannequin */}
      <TouchableOpacity
        style={[styles.avatarBanner, { backgroundColor: theme.colors.surface }]}
        onPress={() => router.push('/(app)/avatar' as never)}
        activeOpacity={0.8}
      >
        <View>
          <Text style={styles.avatarBannerLabel}>MON MANNEQUIN</Text>
          <Text style={styles.avatarBannerSub}>Personnalise ton avatar · Essayage virtuel</Text>
        </View>
        <Text style={styles.avatarBannerArrow}>→</Text>
      </TouchableOpacity>

      {/* RGPD */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>MES DONNÉES</Text>
        <TouchableOpacity style={styles.linkRow} onPress={handleExport}>
          <Text style={styles.linkText}>↓ Exporter mes données (RGPD)</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>SE DÉCONNECTER</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Supprimer mon compte</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  const theme = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: theme.colors.textPrimary }]}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing[5], paddingTop: 0, paddingBottom: spacing[12], gap: spacing[4] },

  headerGradient: {
    marginHorizontal: -spacing[5],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[16],
    paddingBottom: spacing[4],
    marginBottom: spacing[2],
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 22 },
  editBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: '#00C4BF',
    borderRadius: 9999,
  },
  editBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#00C4BF', fontSize: 13 },
  settingsBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: { fontSize: 16 },

  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00C4BF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#FFFFFF' },
  avatarInfo: { flex: 1, gap: 2 },
  avatarName: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  avatarEmail: { fontFamily: 'Poppins_400Regular', fontSize: 12 },

  section: {
    borderWidth: 1,
    padding: spacing[5],
    gap: spacing[3],
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 10, letterSpacing: 2 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  rowLabel: { fontFamily: 'Poppins_500Medium', fontSize: 10, letterSpacing: 1 },
  rowValue: { fontFamily: 'Poppins_500Medium', fontSize: 13 },

  fieldRow: { flexDirection: 'row', gap: spacing[4] },
  fieldHalf: { flex: 1, gap: spacing[2] },
  fieldLabel: { fontFamily: 'Poppins_500Medium', fontSize: 10, letterSpacing: 1 },
  input: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    paddingVertical: spacing[2],
    backgroundColor: 'transparent',
  },
  inputLine: { height: 1 },

  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  genderCard: { width: '46%', borderWidth: 1, padding: spacing[3], gap: 2, borderRadius: 12 },
  genderCardActive: { borderColor: '#00C4BF', backgroundColor: 'rgba(0,196,191,0.08)' },
  genderLabel: { fontFamily: 'Poppins_500Medium', fontSize: 13 },
  genderLabelActive: { color: '#00C4BF' },
  genderSub: { fontFamily: 'Poppins_400Regular', fontSize: 10 },
  genderSubActive: { color: '#00C4BF' },

  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontFamily: 'Poppins_700Bold', fontSize: 15, letterSpacing: 1 },
  planSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 3 },
  upgradeBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 9999,
    backgroundColor: '#00C4BF',
  },
  upgradeBtnText: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 1,
  },

  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  tag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderRadius: 9999,
  },
  tagActive: { backgroundColor: '#00C4BF', borderColor: '#00C4BF' },
  tagText: { fontFamily: 'Poppins_500Medium', fontSize: 12 },
  tagTextActive: { color: '#FFFFFF' },

  editActions: { gap: spacing[2] },
  saveBtn: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#00C4BF',
  },
  saveBtnText: { fontFamily: 'Poppins_700Bold', color: '#FFFFFF', fontSize: 13, letterSpacing: 2 },
  cancelBtn: { paddingVertical: spacing[3], alignItems: 'center' },
  cancelBtnText: { fontFamily: 'Poppins_400Regular', fontSize: 13 },

  linkRow: { paddingVertical: spacing[2] },
  linkText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#00C4BF' },

  logoutBtn: {
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.20)',
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 14,
  },
  logoutText: { fontFamily: 'Poppins_700Bold', color: '#FF6B6B', fontSize: 13, letterSpacing: 2 },
  deleteBtn: { paddingVertical: spacing[3], alignItems: 'center' },
  deleteBtnText: { fontFamily: 'Poppins_400Regular', color: '#FF6B6B', fontSize: 12, opacity: 0.7 },

  stylePassBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFD54F',
    padding: spacing[5],
    borderRadius: 16,
  },
  stylePassLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#F59E0B',
    letterSpacing: 1,
  },
  stylePassSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 3,
    opacity: 0.8,
  },
  stylePassArrow: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#F59E0B' },

  avatarBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing[5],
    borderRadius: 16,
  },
  avatarBannerLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#00C4BF',
    letterSpacing: 1,
  },
  avatarBannerSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#00C4BF',
    marginTop: 3,
    opacity: 0.75,
  },
  avatarBannerArrow: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#00C4BF' },
});

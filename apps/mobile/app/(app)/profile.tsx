import { colors, typography, spacing } from '@outfit-now/design-tokens';
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

import type { Gender } from '@outfit-now/shared-types';
import { useAuthStore } from '../../hooks/useAuth';
import { updateMe, requestExport, deleteAccount } from '../../lib/auth';

const STYLE_TAGS = [
  'Minimaliste', 'Casual', 'Classique', 'Sportswear', 'Bohème',
  'Urbain', 'Chic', 'Vintage', 'Streetwear', 'Business',
];

const GENDER_OPTIONS: { label: string; value: Gender; sub: string }[] = [
  { label: 'Homme', value: 'male', sub: 'Mode masculine' },
  { label: 'Femme', value: 'female', sub: 'Mode féminine' },
  { label: 'Non-binaire', value: 'non_binary', sub: 'Mode inclusive' },
  { label: 'Non précisé', value: 'prefer_not_to_say', sub: 'Toutes suggestions' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refresh } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [stylePref, setStylePref] = useState<string[]>(user?.stylePreferences ?? []);
  const [saving, setSaving] = useState(false);

  function toggleStyle(tag: string) {
    setStylePref((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateMe({ firstName, lastName, gender: gender ?? undefined, stylePreferences: stylePref });
      await refresh();
      setEditing(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessaie.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    Alert.alert(
      'Exporter mes données',
      'Tu recevras un email avec tes données dans les 24h.',
      [
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
      ],
    );
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>MON</Text>
          <Text style={styles.title}>PROFIL</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'center' }}>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>MODIFIER</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push('/(app)/settings' as never)} style={styles.settingsBtn}>
            <Text style={styles.settingsBtnText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Infos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMATIONS</Text>
        {editing ? (
          <>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>PRÉNOM</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Jean"
                  placeholderTextColor={colors.neutral[700]}
                  keyboardAppearance="dark"
                />
                <View style={styles.inputLine} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>NOM</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Dupont"
                  placeholderTextColor={colors.neutral[700]}
                  keyboardAppearance="dark"
                />
                <View style={styles.inputLine} />
              </View>
            </View>

            <Text style={styles.fieldLabel}>GENRE</Text>
            <View style={styles.genderGrid}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.genderCard, gender === opt.value && styles.genderCardActive]}
                  onPress={() => setGender(opt.value)}
                >
                  <Text style={[styles.genderLabel, gender === opt.value && styles.genderLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.genderSub, gender === opt.value && styles.genderSubActive]}>
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABONNEMENT</Text>
        <View style={styles.planRow}>
          <View>
            <Text style={styles.planName}>
              {user?.tier === 'premium' ? 'PREMIUM' : 'GRATUIT'}
            </Text>
            <Text style={styles.planSub}>
              {user?.tier === 'premium'
                ? 'Briefs illimités · Dressing illimité'
                : '3 briefs/jour · 50 pièces max'}
            </Text>
          </View>
          {user?.tier !== 'premium' && (
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => router.push('/(app)/premium' as never)}
            >
              <Text style={styles.upgradeBtnText}>PREMIUM →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Style préférences */}
      {editing ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STYLES PRÉFÉRÉS</Text>
          <View style={styles.tagsGrid}>
            {STYLE_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, stylePref.includes(tag) && styles.tagActive]}
                onPress={() => toggleStyle(tag)}
              >
                <Text style={[styles.tagText, stylePref.includes(tag) && styles.tagTextActive]}>
                  {tag.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (user?.stylePreferences?.length ?? 0) > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STYLES PRÉFÉRÉS</Text>
          <View style={styles.tagsGrid}>
            {(user?.stylePreferences ?? []).map((tag) => (
              <View key={tag} style={[styles.tag, styles.tagActive]}>
                <Text style={[styles.tagText, styles.tagTextActive]}>{tag.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Boutons édition */}
      {editing && (
        <View style={styles.editActions}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color={colors.neutral[950]} />
              : <Text style={styles.saveBtnText}>ENREGISTRER</Text>}
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
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mannequin */}
      <TouchableOpacity
        style={styles.avatarBanner}
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MES DONNÉES</Text>
        <TouchableOpacity style={styles.linkRow} onPress={handleExport}>
          <Text style={styles.linkText}>↓  Exporter mes données (RGPD)</Text>
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
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  content: {
    padding: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[12],
    gap: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
    paddingBottom: spacing[4],
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
  },
  editBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.primary[700],
  },
  editBtnText: {
    color: colors.primary[400],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 2,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: colors.neutral[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: {
    fontSize: 16,
    color: colors.neutral[500],
  },
  section: {
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    padding: spacing[5],
    gap: spacing[3],
    borderRadius: 14,
  },
  sectionTitle: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  rowLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  rowValue: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[300],
    fontWeight: typography.fontWeight.medium,
  },
  fieldRow: { flexDirection: 'row', gap: spacing[4] },
  fieldHalf: { flex: 1, gap: spacing[2] },
  fieldLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[0],
    paddingVertical: spacing[2],
    backgroundColor: 'transparent',
  },
  inputLine: {
    height: 1,
    backgroundColor: colors.neutral[800],
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  genderCard: {
    width: '46%',
    borderWidth: 1,
    borderColor: colors.neutral[700],
    padding: spacing[3],
    gap: 2,
    backgroundColor: colors.neutral[800],
  },
  genderCardActive: {
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(36,72,216,0.08)',
  },
  genderLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    fontWeight: typography.fontWeight.semibold,
  },
  genderLabelActive: { color: colors.primary[300] },
  genderSub: {
    fontSize: 9,
    color: colors.neutral[700],
  },
  genderSubActive: { color: colors.primary[700] },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: 2,
  },
  planSub: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    marginTop: 3,
  },
  upgradeBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[500],
    borderRadius: 9999,
  },
  upgradeBtnText: {
    color: colors.neutral[950],
    fontSize: 9,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 2,
  },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  tag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[700],
    backgroundColor: colors.neutral[900],
    borderRadius: 9999,
  },
  tagActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  tagText: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.medium,
  },
  tagTextActive: { color: colors.neutral[950] },
  editActions: { gap: spacing[2] },
  saveBtn: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 9999,
  },
  saveBtnText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
  cancelBtn: {
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.neutral[600], fontSize: typography.fontSize.sm },
  linkRow: { paddingVertical: spacing[2] },
  linkText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: colors.neutral[800],
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 9999,
  },
  logoutText: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
  deleteBtn: {
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  deleteBtnText: { color: colors.error, fontSize: typography.fontSize.xs, letterSpacing: 1 },
  avatarBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.primary[600],
    padding: spacing[5],
    borderRadius: 14,
  },
  avatarBannerLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    color: colors.primary[400],
    letterSpacing: 2,
  },
  avatarBannerSub: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 3,
    letterSpacing: 0.5,
  },
  avatarBannerArrow: {
    fontSize: typography.fontSize.xl,
    color: colors.primary[500],
  },
});

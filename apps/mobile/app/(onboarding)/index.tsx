import { colors, typography, spacing } from '@outfit-now/design-tokens';
import type { Gender } from '@outfit-now/shared-types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';

import { useAuthStore } from '../../hooks/useAuth';
import { track } from '../../lib/analytics';
import { completeOnboarding } from '../../lib/auth';

const TOTAL_STEPS = 5;

const GENDERS: { label: string; value: Gender; sub: string }[] = [
  { label: 'Homme', value: 'male', sub: 'Mode masculine' },
  { label: 'Femme', value: 'female', sub: 'Mode féminine' },
  { label: 'Non-binaire', value: 'non_binary', sub: 'Mode inclusive' },
  { label: 'Non précisé', value: 'prefer_not_to_say', sub: 'Toutes suggestions' },
];

const STYLES = [
  'Minimaliste', 'Casual', 'Classique', 'Sportswear',
  'Bohème', 'Urbain', 'Chic', 'Vintage', 'Streetwear', 'Business',
];

const COLORS = [
  { label: 'Neutres', value: 'neutres' },
  { label: 'Noirs & gris', value: 'noir_gris' },
  { label: 'Bleus', value: 'bleus' },
  { label: 'Verts', value: 'verts' },
  { label: 'Rouges', value: 'rouges' },
  { label: 'Beiges', value: 'beiges' },
  { label: 'Pastels', value: 'pastels' },
  { label: 'Colorés', value: 'colores' },
];

const BODY_TYPES = [
  { label: 'Slim', value: 'slim' },
  { label: 'Athletic', value: 'athletic' },
  { label: 'Curvy', value: 'curvy' },
  { label: 'Petite', value: 'petite' },
  { label: 'Grande', value: 'tall' },
  { label: 'Autre', value: 'other' },
];

const STEP_LABELS = ['GENRE', 'INFOS', 'STYLE', 'COULEURS', 'MORPHO'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { refresh } = useAuthStore();

  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<Gender | null>(null);
  const [birthYear, setBirthYear] = useState('');
  const [height, setHeight] = useState('');
  const [styles_, setStyles_] = useState<string[]>([]);
  const [colorPrefs, setColorPrefs] = useState<string[]>([]);
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleStyle(label: string) {
    setStyles_((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label],
    );
  }

  function toggleColor(value: string) {
    setColorPrefs((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    );
  }

  function canProceed() {
    if (step === 1) return gender !== null;
    if (step === 3) return styles_.length >= 1;
    if (step === 4) return colorPrefs.length >= 1;
    return true;
  }

  async function handleFinish() {
    if (!gender) return;
    setSaving(true);
    try {
      await completeOnboarding({ gender, stylePreferences: styles_, bodyType: bodyType ?? undefined });
      track.onboardingCompleted({ gender, styleCount: styles_.length });
      await refresh();
      router.replace('/(app)/dressing');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessaie.');
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else void handleFinish();
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressRow}>
          {STEP_LABELS.map((label, i) => (
            <View key={label} style={styles.stepItem}>
              <View style={[styles.stepDot, i < step && styles.stepDotDone, i + 1 === step && styles.stepDotActive]} />
              <Text style={[styles.stepDotLabel, i + 1 === step && styles.stepDotLabelActive]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrow}>ÉTAPE 01</Text>
            <Text style={styles.stepTitle}>Comment{'\n'}t'habilles-tu ?</Text>
            <Text style={styles.stepSub}>L'IA adapte chaque tenue à ton style vestimentaire.</Text>
            <View style={styles.genderGrid}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.genderCard, gender === g.value && styles.genderCardActive]}
                  onPress={() => setGender(g.value)}
                >
                  <Text style={[styles.genderLabel, gender === g.value && styles.genderLabelActive]}>
                    {g.label}
                  </Text>
                  <Text style={[styles.genderSub, gender === g.value && styles.genderSubActive]}>
                    {g.sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrow}>ÉTAPE 02</Text>
            <Text style={styles.stepTitle}>Quelques infos{'\n'}(optionnelles)</Text>
            <Text style={styles.stepSub}>Pour des suggestions encore plus personnalisées.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ANNÉE DE NAISSANCE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 1995"
                placeholderTextColor={colors.neutral[700]}
                keyboardType="number-pad"
                value={birthYear}
                onChangeText={setBirthYear}
                maxLength={4}
                keyboardAppearance="light"
              />
              <View style={styles.inputLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>TAILLE (CM)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 175"
                placeholderTextColor={colors.neutral[700]}
                keyboardType="number-pad"
                value={height}
                onChangeText={setHeight}
                maxLength={3}
                keyboardAppearance="light"
              />
              <View style={styles.inputLine} />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrow}>ÉTAPE 03</Text>
            <Text style={styles.stepTitle}>Tes styles{'\n'}préférés</Text>
            <Text style={styles.stepSub}>Choisis au moins 1 style qui te correspond.</Text>
            <View style={styles.tagGrid}>
              {STYLES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.tagChip, styles_.includes(s) && styles.tagChipActive]}
                  onPress={() => toggleStyle(s)}
                >
                  <Text style={[styles.tagLabel, styles_.includes(s) && styles.tagLabelActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrow}>ÉTAPE 04</Text>
            <Text style={styles.stepTitle}>Tes couleurs{'\n'}fétiches</Text>
            <Text style={styles.stepSub}>Quelles palettes dominent dans ton dressing ?</Text>
            <View style={styles.tagGrid}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.tagChip, colorPrefs.includes(c.value) && styles.tagChipActive]}
                  onPress={() => toggleColor(c.value)}
                >
                  <Text style={[styles.tagLabel, colorPrefs.includes(c.value) && styles.tagLabelActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrow}>ÉTAPE 05</Text>
            <Text style={styles.stepTitle}>Ta{'\n'}morphologie</Text>
            <Text style={styles.stepSub}>Pour adapter les suggestions à ta silhouette (optionnel).</Text>
            <View style={styles.bodyGrid}>
              {BODY_TYPES.map((b) => (
                <TouchableOpacity
                  key={b.value}
                  style={[styles.bodyCard, bodyType === b.value && styles.bodyCardActive]}
                  onPress={() => setBodyType(b.value)}
                >
                  <Text style={[styles.bodyLabel, bodyType === b.value && styles.bodyLabelActive]}>
                    {b.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.neutral[950]} />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === TOTAL_STEPS ? 'COMMENCER' : 'CONTINUER'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  header: {
    paddingTop: spacing[16],
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[5],
    gap: spacing[3],
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral[800],
  },
  stepDotDone: { backgroundColor: colors.primary[700] },
  stepDotActive: { backgroundColor: colors.primary[400], width: 16 },
  stepDotLabel: {
    fontSize: 9,
    color: colors.neutral[700],
    letterSpacing: 1,
    fontWeight: typography.fontWeight.medium,
  },
  stepDotLabelActive: { color: colors.primary[400] },
  progressTrack: {
    height: 1,
    backgroundColor: colors.neutral[800],
    overflow: 'hidden',
  },
  progressFill: {
    height: 1,
    backgroundColor: colors.primary[500],
  },
  content: { paddingHorizontal: spacing[6], paddingBottom: spacing[4] },
  stepContainer: { gap: spacing[5], paddingTop: spacing[4] },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
  },
  stepTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
    lineHeight: 40,
  },
  stepSub: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    lineHeight: 22,
    marginTop: -spacing[2],
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  genderCard: {
    width: '46%',
    borderWidth: 1,
    borderColor: colors.neutral[800],
    padding: spacing[5],
    gap: spacing[1],
    backgroundColor: colors.neutral[900],
    borderRadius: 14,
  },
  genderCardActive: {
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(36,72,216,0.08)',
  },
  genderLabel: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[300],
    fontWeight: typography.fontWeight.semibold,
  },
  genderLabelActive: { color: colors.primary[300] },
  genderSub: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
  },
  genderSubActive: { color: colors.primary[600] },
  inputGroup: { gap: spacing[2] },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  textInput: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[0],
    paddingVertical: spacing[2],
    backgroundColor: 'transparent',
  },
  inputLine: {
    height: 1,
    backgroundColor: colors.neutral[800],
  },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  tagChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    borderRadius: 9999,
  },
  tagChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  tagLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    fontWeight: typography.fontWeight.medium,
  },
  tagLabelActive: { color: colors.neutral[950] },
  bodyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  bodyCard: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    borderRadius: 9999,
  },
  bodyCardActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  bodyLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    fontWeight: typography.fontWeight.medium,
  },
  bodyLabelActive: { color: colors.neutral[950] },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
    paddingTop: spacing[4],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[900],
  },
  backBtn: {
    width: 56,
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[800],
    borderRadius: 9999,
  },
  backBtnText: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.lg,
  },
  nextBtn: {
    flex: 1,
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 9999,
    shadowColor: '#2448D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  nextBtnDisabled: { backgroundColor: colors.neutral[700], shadowOpacity: 0 },
  nextBtnText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
});

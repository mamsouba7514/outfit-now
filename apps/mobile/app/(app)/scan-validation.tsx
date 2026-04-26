import { colors, typography, spacing } from '@outfit-now/design-tokens';
import type { ClothingCategory, Season, DressingItem } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';

import { useDressingStore } from '../../hooks/useDressing';
import { getDressingItem, updateDressingItem } from '../../lib/dressing';

const CATEGORIES: { label: string; value: ClothingCategory }[] = [
  { label: 'Hauts', value: 'tops' },
  { label: 'Bas', value: 'bottoms' },
  { label: 'Robes', value: 'dresses' },
  { label: 'Manteaux', value: 'outerwear' },
  { label: 'Chaussures', value: 'shoes' },
  { label: 'Accessoires', value: 'accessories' },
  { label: 'Sacs', value: 'bags' },
  { label: 'Maillots', value: 'swimwear' },
  { label: 'Sport', value: 'activewear' },
  { label: 'Sous-vêt.', value: 'underwear' },
];

const SEASONS: { label: string; value: Season }[] = [
  { label: 'Printemps', value: 'spring' },
  { label: 'Été', value: 'summer' },
  { label: 'Automne', value: 'autumn' },
  { label: 'Hiver', value: 'winter' },
  { label: 'Toutes', value: 'all' },
];

export default function ScanValidationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useDressingStore();

  const [item, setItem] = useState<DressingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState<ClothingCategory>('tops');
  const [primaryColor, setPrimaryColor] = useState('');
  const [brand, setBrand] = useState('');
  const [seasons, setSeasons] = useState<Season[]>(['all']);
  const [tagInput, setTagInput] = useState('');
  const [styleTags, setStyleTags] = useState<string[]>([]);

  useEffect(() => {
    getDressingItem(id)
      .then((data) => {
        setItem(data);
        setCategory(data.category);
        setPrimaryColor(data.primaryColor);
        setBrand(data.brand ?? '');
        setSeasons(data.season.length > 0 ? data.season : ['all']);
        setStyleTags(data.styleTags);
      })
      .catch(() => {
        Alert.alert('Erreur', 'Impossible de charger la pièce.');
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id]);

  function toggleSeason(s: Season) {
    setSeasons((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !styleTags.includes(tag)) {
      setStyleTags((prev) => [...prev, tag]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setStyleTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateDressingItem(id, {
        category,
        primaryColor: primaryColor.trim() || undefined,
        styleTags,
        brand: brand.trim() || undefined,
        season: seasons,
      });
      addItem(updated);
      router.replace(`/(app)/dressing/${id}` as never);
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessaie.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={colors.primary[400]} />
        <Text style={styles.loadingText}>Analyse en cours…</Text>
      </View>
    );
  }

  if (!item) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>ANALYSE IA</Text>
        <Text style={styles.title}>VALIDER LA PIÈCE</Text>
        <Text style={styles.subtitle}>Vérifie et corrige les informations détectées.</Text>
      </View>

      <Image source={{ uri: item.imageUrl }} style={styles.photo} contentFit="cover" />

      {/* Catégorie */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CATÉGORIE</Text>
        <View style={styles.chipGrid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.chip, category === c.value && styles.chipActive]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>
                {c.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Couleur */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>COULEUR PRINCIPALE</Text>
        <TextInput
          style={styles.textInput}
          value={primaryColor}
          onChangeText={setPrimaryColor}
          placeholder="Ex: bleu marine, blanc cassé…"
          placeholderTextColor={colors.neutral[700]}
          autoCapitalize="none"
          keyboardAppearance="dark"
        />
        <View style={styles.inputLine} />
      </View>

      {/* Marque */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>MARQUE <Text style={styles.optional}>(optionnel)</Text></Text>
        <TextInput
          style={styles.textInput}
          value={brand}
          onChangeText={setBrand}
          placeholder="Ex: Zara, Uniqlo…"
          placeholderTextColor={colors.neutral[700]}
          keyboardAppearance="dark"
        />
        <View style={styles.inputLine} />
      </View>

      {/* Saisons */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SAISONS</Text>
        <View style={styles.chipGrid}>
          {SEASONS.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.chip, seasons.includes(s.value) && styles.chipActive]}
              onPress={() => toggleSeason(s.value)}
            >
              <Text style={[styles.chipText, seasons.includes(s.value) && styles.chipTextActive]}>
                {s.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tags de style */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TAGS DE STYLE</Text>
        <View style={styles.tagInputRow}>
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="casual, oversize, basique…"
            placeholderTextColor={colors.neutral[700]}
            autoCapitalize="none"
            onSubmitEditing={addTag}
            returnKeyType="done"
            keyboardAppearance="dark"
          />
          <TouchableOpacity style={styles.addTagBtn} onPress={addTag}>
            <Text style={styles.addTagBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputLine} />
        {styleTags.length > 0 && (
          <View style={styles.tagsRow}>
            {styleTags.map((tag) => (
              <TouchableOpacity key={tag} style={styles.tagBubble} onPress={() => removeTag(tag)}>
                <Text style={styles.tagBubbleText}>{tag} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={colors.neutral[950]} />
        ) : (
          <Text style={styles.saveBtnText}>AJOUTER AU DRESSING</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  content: { paddingBottom: spacing[12] },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    backgroundColor: colors.neutral[950],
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    letterSpacing: 1,
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[4],
    gap: spacing[2],
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    letterSpacing: 4,
    fontWeight: typography.fontWeight.black,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  photo: { width: '100%', height: 300 },
  section: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    gap: spacing[3],
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  optional: {
    color: colors.neutral[700],
    letterSpacing: 0,
    fontWeight: typography.fontWeight.regular,
    textTransform: 'none',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
  },
  chipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipText: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.medium,
  },
  chipTextActive: { color: colors.neutral[950] },
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
  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  addTagBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagBtnText: {
    color: colors.neutral[950],
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 26,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  tagBubble: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.primary[800],
    backgroundColor: 'rgba(196,154,46,0.08)',
  },
  tagBubbleText: {
    fontSize: 9,
    color: colors.primary[400],
    letterSpacing: 1,
    fontWeight: typography.fontWeight.medium,
  },
  saveBtn: {
    marginHorizontal: spacing[6],
    marginTop: spacing[8],
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
});

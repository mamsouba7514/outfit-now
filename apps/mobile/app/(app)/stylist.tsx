import { colors, typography, spacing } from '@outfit-now/design-tokens';
import type { ComposeMode, Occasion, Outfit, ShoppingResult } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { useRef, useState, useEffect } from 'react';

import { getStyleProfile, type StyleProfile } from '../../lib/styleProfile';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';

import { createBrief, getBrief, outfitAction } from '../../lib/briefs';
import { useWeather } from '../../hooks/useWeather';

const CATEGORY_FR: Record<string, string> = {
  tops: 'Hauts', bottoms: 'Bas', dresses: 'Robes', outerwear: 'Manteaux',
  shoes: 'Chaussures', accessories: 'Accessoires', bags: 'Sacs',
  swimwear: 'Maillots', activewear: 'Sport', underwear: 'Sous-vêt.',
};

type Step = 'form' | 'waiting' | 'results';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OCCASIONS: { label: string; value: Occasion }[] = [
  { label: 'Casual', value: 'casual' },
  { label: 'Travail', value: 'work' },
  { label: 'Soirée', value: 'evening' },
  { label: 'Formel', value: 'formal' },
  { label: 'Sport', value: 'sport' },
  { label: 'Weekend', value: 'weekend' },
  { label: 'Voyage', value: 'travel' },
  { label: 'Rendez-vous', value: 'date' },
  { label: 'Fête', value: 'party' },
  { label: 'Plage', value: 'beach' },
  { label: 'Cérémonie', value: 'ceremony' },
  { label: 'Gala', value: 'gala' },
  { label: 'Dîner', value: 'dinner' },
  { label: 'Outdoor', value: 'outdoor' },
];

const STYLE_CHIPS = [
  'Minimaliste', 'Casual', 'Élégant', 'Streetwear',
  'Bohème', 'Sportif', 'Chic', 'Rock',
];

type GenerationTier = 'standard' | 'premium' | 'luxe';

const TIERS: { value: GenerationTier; roman: string; label: string; tagline: string; features: string[] }[] = [
  {
    value: 'standard',
    roman: 'I',
    label: 'STANDARD',
    tagline: 'Analyse stylée de ton dressing',
    features: ['Composition rapide', 'Score de cohérence', 'Suggestions de base'],
  },
  {
    value: 'premium',
    roman: 'II',
    label: 'PREMIUM',
    tagline: 'Curation approfondie & personnalisée',
    features: ['Analyse poussée des pièces', 'Conseils de style détaillés', 'Meilleures combinaisons'],
  },
  {
    value: 'luxe',
    roman: 'III',
    label: 'LUXE',
    tagline: 'Expérience stylist haut de gamme',
    features: ['Curation experte sans compromis', 'Storytelling de chaque tenue', 'Résultats premium garantis'],
  },
];

const COMPOSE_MODES: { label: string; value: ComposeMode; sub: string }[] = [
  { label: 'DRESSING', value: 'dressing', sub: 'Mes pièces uniquement' },
  { label: 'MIX', value: 'mix', sub: 'Pièces + shopping' },
  { label: 'SHOPPING', value: 'new', sub: 'Nouvelles pièces' },
];

const BUDGET_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Sans limite', value: null },
  { label: '< 100 €', value: 100 },
  { label: '100–300 €', value: 300 },
  { label: '300–500 €', value: 500 },
  { label: '500 €+', value: 1000 },
];

function ShoppingSection({ results }: { results: ShoppingResult[] }) {
  return (
    <View style={styles.shoppingSection}>
      <Text style={styles.shoppingSectionLabel}>ACHETER EN LIGNE</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shoppingScroll}
      >
        {results.map((product, i) => (
          <TouchableOpacity
            key={i}
            style={styles.shoppingCard}
            onPress={() => product.link && Linking.openURL(product.link)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: product.imageUrl }} style={styles.shoppingImage} contentFit="cover" />
            <View style={styles.shoppingInfo}>
              <Text style={styles.shoppingTitle} numberOfLines={2}>{product.title}</Text>
              <Text style={styles.shoppingPrice}>{product.price}</Text>
              <Text style={styles.shoppingStore} numberOfLines={1}>{product.store}</Text>
              <Text style={styles.shoppingCta}>VOIR →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function StylistScreen() {
  const router = useRouter();
  const { weather, loading: weatherLoading } = useWeather();
  const carouselRef = useRef<FlatList<Outfit>>(null);

  const [step, setStep] = useState<Step>('form');
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [tier, setTier] = useState<GenerationTier>('standard');
  const [composeMode, setComposeMode] = useState<ComposeMode>('dressing');
  const [budget, setBudget] = useState<number | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);

  // Karl's memory of the user — loaded on mount
  const [karlProfile, setKarlProfile] = useState<StyleProfile | null>(null);

  useEffect(() => {
    getStyleProfile().then(setKarlProfile);
  }, []);

  function toggleStyle(tag: string) {
    setSelectedStyles((prev) =>
      prev.includes(tag) ? prev.filter((s) => s !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit() {
    if (!occasion) {
      Alert.alert('Occasion requise', 'Choisis une occasion pour continuer.');
      return;
    }
    setStep('waiting');

    try {
      const tierNote = tier === 'premium' ? 'Génération premium — curation approfondie.' : tier === 'luxe' ? 'Génération luxe — expérience stylist haut de gamme, aucun compromis.' : undefined;
      const { id: briefId } = await createBrief({
        occasion,
        styleTags: selectedStyles.length > 0 ? selectedStyles : undefined,
        budget: budget ?? undefined,
        composeMode,
        weatherNote: weather?.note,
        styleNotes: tierNote,
      });

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const brief = await getBrief(briefId);
          if (brief.status === 'completed') {
            clearInterval(poll);
            setOutfits(brief.outfits ?? []);
            setCurrentIndex(0);
            setStep('results');
          } else if (brief.status === 'failed' || attempts > 60) {
            clearInterval(poll);
            Alert.alert('Erreur', brief.errorMessage ?? 'Génération échouée. Réessaie.');
            setStep('form');
          }
        } catch {
          clearInterval(poll);
          setStep('form');
        }
      }, 2000);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Réessaie.');
      setStep('form');
    }
  }

  async function handleAction(outfit: Outfit, action: 'save' | 'worn' | 'discard') {
    try {
      await outfitAction(outfit.id, action);
      if (action === 'discard') {
        const next = outfits.filter((o) => o.id !== outfit.id);
        setOutfits(next);
        if (next.length === 0) setStep('form');
      } else {
        Alert.alert(
          action === 'save' ? 'Enregistré' : 'Super !',
          action === 'save' ? 'Tenue sauvegardée.' : 'Porté — ton dressing est mis à jour.',
        );
      }
    } catch {
      Alert.alert('Erreur', 'Action impossible. Réessaie.');
    }
  }

  function resetForm() {
    setStep('form');
    setOccasion(null);
    setSelectedStyles([]);
    setTier('standard');
    setComposeMode('dressing');
    setBudget(null);
    setOutfits([]);
    setCurrentIndex(0);
  }

  // ── Outfit detail ───────────────────────────────────────────────────────────
  if (selectedOutfit) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity onPress={() => setSelectedOutfit(null)} style={styles.backRow}>
          <Text style={styles.backText}>← RETOUR AUX TENUES</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>DÉTAIL DE LA TENUE</Text>
        <Text style={styles.detailTitle}>Tenue complète</Text>

        {selectedOutfit.justification ? (
          <Text style={styles.justification}>{selectedOutfit.justification}</Text>
        ) : null}

        <Text style={styles.sectionLabel}>PIÈCES</Text>
        <View style={styles.itemsGrid}>
          {selectedOutfit.items.map((item) => (
            <View key={item.id} style={styles.outfitItemCard}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.outfitItemImage} contentFit="cover" />
              ) : (
                <View style={styles.outfitItemPlaceholder}>
                  <Text style={styles.placeholderIcon}>◈</Text>
                </View>
              )}
              <Text style={styles.outfitItemCategory} numberOfLines={1}>
                {(CATEGORY_FR[item.category ?? ''] ?? item.category ?? '').toUpperCase()}
              </Text>
              <Text style={styles.outfitItemColor} numberOfLines={1}>{item.primaryColor}</Text>
            </View>
          ))}
        </View>

        {(selectedOutfit.shoppingResults?.length ?? 0) > 0 && (
          <ShoppingSection results={selectedOutfit.shoppingResults!} />
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnWorn} onPress={() => handleAction(selectedOutfit, 'worn')}>
            <Text style={styles.btnPrimaryText}>JE LA PORTE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSave} onPress={() => handleAction(selectedOutfit, 'save')}>
            <Text style={styles.btnSecondaryText}>ENREGISTRER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDiscard} onPress={() => handleAction(selectedOutfit, 'discard')}>
            <Text style={styles.btnDiscardText}>Rejeter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Waiting ─────────────────────────────────────────────────────────────────
  if (step === 'waiting') {
    return (
      <View style={styles.waitingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={colors.primary[400]} />
        <Text style={styles.waitingTitle}>KARL COMPOSE</Text>
        <Text style={styles.waitingText}>
          {karlProfile && karlProfile.styleConfidence > 0.4
            ? `Karl analyse votre dressing et votre style appris…`
            : `Karl analyse votre dressing avec soin…`}
        </Text>
        <Text style={styles.waitingSubText}>5 à 15 secondes</Text>
        {karlProfile && karlProfile.styleConfidence > 0 && (
          <Text style={styles.waitingKarlNote}>
            Mémoire Karl : {Math.round(karlProfile.styleConfidence * 100)}%
          </Text>
        )}
      </View>
    );
  }

  // ── Results carousel ────────────────────────────────────────────────────────
  if (step === 'results') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.resultsHeader}>
          <Text style={styles.eyebrow}>KARL PRÉSENTE</Text>
          <View style={styles.resultsHeaderRow}>
            <Text style={styles.resultsTitle}>TES TENUES</Text>
            <Text style={styles.resultsCounter}>
              {currentIndex + 1}<Text style={styles.resultsCounterMax}>/{outfits.length}</Text>
            </Text>
          </View>
        </View>

        <FlatList
          ref={carouselRef}
          data={outfits}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(idx);
          }}
          renderItem={({ item: outfit, index }) => (
            <View style={styles.carouselPage}>
              <ScrollView contentContainerStyle={styles.carouselContent} showsVerticalScrollIndicator={false}>
                <View style={styles.outfitCardHeader}>
                  <Text style={styles.outfitCardTitle}>TENUE {index + 1}</Text>
                  <View style={styles.scoreChip}>
                    <Text style={styles.scoreValue}>{Math.round(outfit.score * 100)}%</Text>
                  </View>
                </View>

                <Text style={styles.outfitJustif}>{outfit.justification}</Text>

                <Text style={styles.sectionLabel}>PIÈCES</Text>
                <View style={styles.itemsGrid}>
                  {outfit.items.map((item) => (
                    <View key={item.id} style={styles.outfitItemCard}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.outfitItemImage} contentFit="cover" />
                      ) : (
                        <View style={styles.outfitItemPlaceholder}>
                          <Text style={styles.placeholderIcon}>◈</Text>
                        </View>
                      )}
                      <Text style={styles.outfitItemCategory} numberOfLines={1}>
                        {(CATEGORY_FR[item.category ?? ''] ?? item.category ?? '').toUpperCase()}
                      </Text>
                      <Text style={styles.outfitItemColor} numberOfLines={1}>{item.primaryColor}</Text>
                    </View>
                  ))}
                </View>

                {(outfit.shoppingResults?.length ?? 0) > 0 && (
                  <ShoppingSection results={outfit.shoppingResults!} />
                )}

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.btnWorn} onPress={() => handleAction(outfit, 'worn')}>
                    <Text style={styles.btnPrimaryText}>JE LA PORTE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnSave} onPress={() => handleAction(outfit, 'save')}>
                    <Text style={styles.btnSecondaryText}>ENREGISTRER</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnDiscard} onPress={() => handleAction(outfit, 'discard')}>
                    <Text style={styles.btnDiscardText}>Rejeter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedOutfit(outfit)}>
                    <Text style={styles.detailLink}>Voir le détail →</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        />

        <View style={styles.dotsRow}>
          {outfits.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.newBriefBtn} onPress={resetForm}>
          <Text style={styles.newBriefText}>NOUVEAU BRIEF</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.formHeader}>
        <Text style={styles.eyebrow}>TON STYLISTE PERSONNEL</Text>
        <Text style={styles.formTitle}>KARL</Text>
        <View style={styles.formDivider} />
        <Text style={styles.formSub}>Plus tu enrichis ton dressing et partages tes looks, plus Karl te connaît.</Text>
      </View>

      {/* Karl's memory card */}
      {karlProfile && (
        <View style={styles.karlCard}>
          <View style={styles.karlCardTop}>
            <View>
              <Text style={styles.karlCardLabel}>MÉMOIRE DE KARL</Text>
              <Text style={styles.karlCardTitle}>{karlProfile.styleConfidenceLabel}</Text>
            </View>
            <View style={styles.karlScoreBadge}>
              <Text style={styles.karlScoreText}>{Math.round(karlProfile.styleConfidence * 100)}%</Text>
            </View>
          </View>

          {/* Confidence bar */}
          <View style={styles.karlBar}>
            <View style={[styles.karlBarFill, { width: `${Math.round(karlProfile.styleConfidence * 100)}%` as any }]} />
          </View>

          {/* What Karl knows */}
          <View style={styles.karlKnowledge}>
            {karlProfile.dominantColors.length > 0 && (
              <View style={styles.karlKnowledgeRow}>
                <Text style={styles.karlKnowledgeKey}>Palette</Text>
                <Text style={styles.karlKnowledgeVal} numberOfLines={1}>
                  {karlProfile.dominantColors.slice(0, 4).join(' · ')}
                </Text>
              </View>
            )}
            {karlProfile.topStyleTags.length > 0 && (
              <View style={styles.karlKnowledgeRow}>
                <Text style={styles.karlKnowledgeKey}>Style</Text>
                <Text style={styles.karlKnowledgeVal} numberOfLines={1}>
                  {karlProfile.topStyleTags.slice(0, 3).join(' · ')}
                </Text>
              </View>
            )}
            {karlProfile.topBrands.length > 0 && (
              <View style={styles.karlKnowledgeRow}>
                <Text style={styles.karlKnowledgeKey}>Marques</Text>
                <Text style={styles.karlKnowledgeVal} numberOfLines={1}>
                  {karlProfile.topBrands.slice(0, 3).join(' · ')}
                </Text>
              </View>
            )}
          </View>

          {/* Signals */}
          <View style={styles.karlSignals}>
            <View style={styles.karlSignal}>
              <Text style={styles.karlSignalValue}>{karlProfile.dressingSize}</Text>
              <Text style={styles.karlSignalLabel}>pièces</Text>
            </View>
            <View style={styles.karlSignalDivider} />
            <View style={styles.karlSignal}>
              <Text style={styles.karlSignalValue}>{karlProfile.savedOutfitsCount}</Text>
              <Text style={styles.karlSignalLabel}>tenues sauvées</Text>
            </View>
            <View style={styles.karlSignalDivider} />
            <View style={styles.karlSignal}>
              <Text style={styles.karlSignalValue}>{karlProfile.postsCount}</Text>
              <Text style={styles.karlSignalLabel}>looks postés</Text>
            </View>
          </View>

          {karlProfile.styleConfidence < 0.4 && (
            <Text style={styles.karlTip}>
              ✦ Ajoutez plus de pièces et postez vos tenues pour que Karl affine sa connaissance de votre style.
            </Text>
          )}
        </View>
      )}

      {/* Occasion */}
      <Text style={styles.sectionLabel}>OCCASION *</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.occasionScroll}
        contentContainerStyle={styles.occasionScrollContent}
      >
        {OCCASIONS.map((occ) => (
          <TouchableOpacity
            key={occ.value}
            style={[styles.occasionChip, occasion === occ.value && styles.occasionChipActive]}
            onPress={() => setOccasion(occ.value)}
          >
            <Text style={[styles.occasionLabel, occasion === occ.value && styles.occasionLabelActive]}>
              {occ.label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Style chips */}
      <Text style={styles.sectionLabel}>STYLE <Text style={styles.optional}>(optionnel)</Text></Text>
      <View style={styles.chipGrid}>
        {STYLE_CHIPS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.styleChip, selectedStyles.includes(tag) && styles.styleChipActive]}
            onPress={() => toggleStyle(tag)}
          >
            <Text style={[styles.styleChipText, selectedStyles.includes(tag) && styles.styleChipTextActive]}>
              {tag.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tier selector */}
      <Text style={styles.sectionLabel}>NIVEAU DE GÉNÉRATION</Text>
      <View style={styles.tiersCol}>
        {TIERS.map((t) => {
          const active = tier === t.value;
          const isLuxe = t.value === 'luxe';
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.tierCard, active && styles.tierCardActive, isLuxe && active && styles.tierCardLuxeActive]}
              onPress={() => setTier(t.value)}
              activeOpacity={0.85}
            >
              <View style={styles.tierLeft}>
                <Text style={[styles.tierRoman, active && styles.tierRomanActive, isLuxe && active && styles.tierRomanLuxe]}>
                  {t.roman}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierLabel, active && styles.tierLabelActive]}>{t.label}</Text>
                  <Text style={styles.tierTagline}>{t.tagline}</Text>
                  {active && (
                    <View style={styles.tierFeatures}>
                      {t.features.map((f, i) => (
                        <Text key={i} style={[styles.tierFeature, isLuxe && { color: colors.primary[400] }]}>— {f}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <View style={[styles.tierCheck, active && styles.tierCheckActive, isLuxe && active && styles.tierCheckLuxe]}>
                {active && <Text style={[styles.tierCheckMark, isLuxe && { color: colors.neutral[950] }]}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Compose mode */}
      <Text style={[styles.sectionLabel, { marginTop: spacing[5] }]}>SOURCE DES PIÈCES</Text>
      <View style={styles.composeModeRow}>
        {COMPOSE_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.value}
            style={[styles.composeModeBtn, composeMode === mode.value && styles.composeModeBtnActive]}
            onPress={() => setComposeMode(mode.value)}
          >
            <Text style={[styles.composeModeLbl, composeMode === mode.value && styles.composeModeLblActive]}>
              {mode.label}
            </Text>
            <Text style={[styles.composeModeSubLbl, composeMode === mode.value && styles.composeModeSubLblActive]}>
              {mode.sub}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Budget */}
      <Text style={[styles.sectionLabel, { marginTop: spacing[4] }]}>BUDGET <Text style={styles.optional}>(optionnel)</Text></Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.budgetScroll}
        contentContainerStyle={styles.budgetScrollContent}
      >
        {BUDGET_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.budgetChip, budget === opt.value && styles.budgetChipActive]}
            onPress={() => setBudget(opt.value)}
          >
            <Text style={[styles.budgetChipText, budget === opt.value && styles.budgetChipTextActive]}>
              {opt.label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Météo */}
      <View style={styles.weatherRow}>
        <Text style={styles.weatherIcon}>◎</Text>
        <Text style={styles.weatherText}>
          {weatherLoading
            ? 'Récupération météo…'
            : weather
              ? `Météo : ${weather.note}`
              : 'Météo indisponible'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, !occasion && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!occasion}
        activeOpacity={0.85}
      >
        <Text style={[styles.submitBtnText, !occasion && styles.submitBtnTextDisabled]}>
          DEMANDER À KARL
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  content: {
    padding: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[10],
  },

  // Back
  backRow: { marginBottom: spacing[5] },
  backText: {
    color: colors.primary[400],
    fontSize: typography.fontSize.xs,
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },

  // Form header
  formHeader: { gap: spacing[2], marginBottom: spacing[6] },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    letterSpacing: 4,
    fontWeight: typography.fontWeight.black,
  },
  formTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
    lineHeight: 40,
  },
  formDivider: {
    width: 48,
    height: 2,
    backgroundColor: '#E8194A',
    marginVertical: spacing[2],
  },
  formSub: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    lineHeight: 22,
  },

  // Section labels
  sectionLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
    marginTop: spacing[5],
    marginBottom: spacing[3],
  },
  optional: {
    color: colors.neutral[700],
    letterSpacing: 0,
    fontWeight: typography.fontWeight.regular,
    textTransform: 'none',
  },

  // Occasion
  occasionScroll: { marginBottom: spacing[2] },
  occasionScrollContent: { gap: spacing[2], paddingRight: spacing[6] },
  occasionChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    borderRadius: 9999,
  },
  occasionChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  occasionLabel: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.medium,
  },
  occasionLabelActive: { color: colors.neutral[950] },

  // Style chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  styleChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    borderRadius: 9999,
  },
  styleChipActive: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[0],
  },
  styleChipText: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.medium,
  },
  styleChipTextActive: { color: colors.neutral[950] },

  // Tier selector
  tiersCol: {
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    padding: spacing[4],
    gap: spacing[3],
    borderRadius: 14,
  },
  tierCardActive: {
    borderColor: colors.primary[400],
    backgroundColor: 'rgba(36,72,216,0.06)',
  },
  tierCardLuxeActive: {
    borderColor: colors.primary[400],
    backgroundColor: 'rgba(36,72,216,0.12)',
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    flex: 1,
  },
  tierRoman: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[800],
    lineHeight: 28,
    width: 24,
  },
  tierRomanActive: { color: colors.primary[400] },
  tierRomanLuxe: { color: colors.primary[300] },
  tierLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[500],
    letterSpacing: 2,
    marginBottom: 3,
  },
  tierLabelActive: { color: colors.neutral[0] },
  tierTagline: {
    fontSize: 10,
    color: colors.neutral[600],
    letterSpacing: 0.3,
  },
  tierRight: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  tierFeatures: {
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: spacing[1],
  },
  tierFeature: {
    fontSize: 9,
    color: colors.neutral[400],
    letterSpacing: 0.5,
  },
  tierCheck: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.neutral[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierCheckActive: {
    borderColor: colors.primary[400],
    backgroundColor: 'transparent',
  },
  tierCheckLuxe: {
    backgroundColor: colors.primary[400],
    borderColor: colors.primary[400],
  },
  tierCheckMark: {
    fontSize: 10,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.bold,
  },

  // Compose mode
  composeModeRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  composeModeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    gap: 4,
  },
  composeModeBtnActive: {
    borderColor: colors.primary[400],
    backgroundColor: 'rgba(36,72,216,0.08)',
  },
  composeModeLbl: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },
  composeModeLblActive: { color: colors.primary[400] },
  composeModeSubLbl: {
    fontSize: 8,
    color: colors.neutral[700],
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  composeModeSubLblActive: { color: colors.primary[700] },

  // Budget
  budgetScroll: { marginBottom: spacing[2] },
  budgetScrollContent: { gap: spacing[2], paddingRight: spacing[6] },
  budgetChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    borderRadius: 9999,
  },
  budgetChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  budgetChipText: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.medium,
  },
  budgetChipTextActive: { color: colors.neutral[950] },

  // Weather
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[900],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginTop: spacing[4],
    marginBottom: spacing[5],
  },
  weatherIcon: { fontSize: 12, color: colors.primary[500] },
  weatherText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    letterSpacing: 0.3,
  },

  // Submit
  submitBtn: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[5],
    alignItems: 'center',
    borderRadius: 9999,
    shadowColor: '#2448D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 7,
  },
  submitBtnDisabled: { backgroundColor: colors.neutral[900] },
  submitBtnText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
  submitBtnTextDisabled: { color: colors.neutral[700] },

  // Waiting
  waitingContainer: {
    flex: 1,
    backgroundColor: colors.neutral[950],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  waitingTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: 4,
    marginTop: spacing[2],
  },
  waitingText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  waitingSubText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[700],
    letterSpacing: 1,
  },
  waitingKarlNote: {
    fontSize: 10,
    color: colors.primary[700],
    letterSpacing: 1.5,
    marginTop: spacing[3],
    fontWeight: typography.fontWeight.bold,
  },

  // ── Karl card ──────────────────────────────────────────────────────────────
  karlCard: {
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.primary[900],
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  karlCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  karlCardLabel: {
    fontSize: 9,
    color: colors.primary[600],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
    marginBottom: 4,
  },
  karlCardTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[100],
    maxWidth: 220,
  },
  karlScoreBadge: {
    borderWidth: 1,
    borderColor: colors.primary[700],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: 'rgba(36,72,216,0.08)',
  },
  karlScoreText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.black,
    color: colors.primary[400],
    letterSpacing: 1,
  },
  karlBar: {
    height: 2,
    backgroundColor: colors.neutral[800],
    overflow: 'hidden',
  },
  karlBarFill: {
    height: 2,
    backgroundColor: colors.primary[500],
  },
  karlKnowledge: {
    gap: spacing[2],
  },
  karlKnowledgeRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  karlKnowledgeKey: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.medium,
    width: 52,
    textTransform: 'uppercase',
    paddingTop: 1,
  },
  karlKnowledgeVal: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[300],
    flex: 1,
  },
  karlSignals: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
    paddingTop: spacing[3],
    gap: spacing[2],
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  karlSignal: { alignItems: 'center', gap: 2 },
  karlSignalValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.primary[400],
    lineHeight: 22,
  },
  karlSignalLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 0.5,
  },
  karlSignalDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.neutral[800],
  },
  karlTip: {
    fontSize: 10,
    color: colors.neutral[600],
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // Results
  resultsHeader: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
    gap: spacing[1],
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  resultsTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
  },
  resultsCounter: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.primary[400],
  },
  resultsCounterMax: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[700],
  },
  carouselPage: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  carouselContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  outfitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  outfitCardTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[500],
    letterSpacing: 3,
  },
  scoreChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    backgroundColor: 'rgba(36,72,216,0.10)',
    borderWidth: 1,
    borderColor: colors.primary[800],
  },
  scoreValue: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.black,
    letterSpacing: 1,
  },
  outfitJustif: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    lineHeight: 22,
    marginBottom: spacing[4],
    fontStyle: 'italic',
  },

  // Detail
  detailTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
    marginBottom: spacing[2],
  },
  justification: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    lineHeight: 24,
    marginBottom: spacing[5],
    fontStyle: 'italic',
  },

  // Items grid
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  outfitItemCard: { width: 84, alignItems: 'center', gap: 4 },
  outfitItemImage: {
    width: 80,
    height: 100,
    backgroundColor: colors.neutral[900],
  },
  outfitItemPlaceholder: {
    width: 80,
    height: 100,
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
    color: colors.neutral[700],
  },
  outfitItemCategory: {
    fontSize: 8,
    color: colors.neutral[600],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.black,
    textAlign: 'center',
  },
  outfitItemColor: {
    fontSize: 8,
    color: colors.neutral[700],
    textAlign: 'center',
    textTransform: 'capitalize',
  },

  // Shopping
  shoppingSection: { marginBottom: spacing[5] },
  shoppingSectionLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
    marginBottom: spacing[3],
  },
  shoppingScroll: { gap: spacing[3], paddingRight: spacing[2] },
  shoppingCard: {
    width: 150,
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    overflow: 'hidden',
  },
  shoppingImage: { width: 150, height: 150 },
  shoppingInfo: { padding: spacing[3], gap: spacing[1] },
  shoppingTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[300],
    fontWeight: typography.fontWeight.medium,
    lineHeight: 16,
  },
  shoppingPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.bold,
  },
  shoppingStore: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
  },
  shoppingCta: {
    fontSize: 9,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.black,
    letterSpacing: 1.5,
    marginTop: 2,
  },

  // Actions
  actions: { gap: spacing[3] },
  btnWorn: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 9999,
  },
  btnSave: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[700],
    borderRadius: 9999,
  },
  btnDiscard: {
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
  btnSecondaryText: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
  btnDiscardText: {
    color: colors.neutral[700],
    fontSize: typography.fontSize.xs,
    letterSpacing: 1,
  },
  detailLink: {
    textAlign: 'center',
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    letterSpacing: 1,
    paddingTop: spacing[1],
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  dot: {
    width: 16,
    height: 2,
    backgroundColor: colors.neutral[800],
  },
  dotActive: {
    width: 32,
    backgroundColor: colors.primary[500],
  },
  newBriefBtn: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[6],
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  newBriefText: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
});

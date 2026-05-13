import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@outfit-now/design-tokens';
import type { ComposeMode, Occasion, Outfit, ShoppingResult } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import {
  Linking,
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
  TextInput,
} from 'react-native';

import { useWeather } from '../../hooks/useWeather';
import { createBrief, getBrief, outfitAction } from '../../lib/briefs';
import { getStyleProfile, type StyleProfile } from '../../lib/styleProfile';

const CATEGORY_FR: Record<string, string> = {
  tops: 'Hauts',
  bottoms: 'Bas',
  dresses: 'Robes',
  outerwear: 'Manteaux',
  shoes: 'Chaussures',
  accessories: 'Accessoires',
  bags: 'Sacs',
  swimwear: 'Maillots',
  activewear: 'Sport',
  underwear: 'Sous-vêt.',
};

type Step = 'form' | 'waiting' | 'results';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OCCASIONS: { label: string; value: Occasion; icon: string }[] = [
  { label: 'Quotidien', value: 'casual', icon: '📅' },
  { label: 'Travail', value: 'work', icon: '💼' },
  { label: 'Soirée', value: 'evening', icon: '🥂' },
  { label: 'Sport', value: 'sport', icon: '👟' },
  { label: 'Weekend', value: 'weekend', icon: '🌅' },
  { label: 'Voyage', value: 'travel', icon: '✈️' },
  { label: 'Rendez-vous', value: 'date', icon: '💝' },
  { label: 'Fête', value: 'party', icon: '🎉' },
  { label: 'Plage', value: 'beach', icon: '🏖️' },
  { label: 'Cérémonie', value: 'ceremony', icon: '🎗️' },
  { label: 'Gala', value: 'gala', icon: '✨' },
  { label: 'Dîner', value: 'dinner', icon: '🍽️' },
  { label: 'Outdoor', value: 'outdoor', icon: '🌿' },
  { label: 'Formel', value: 'formal', icon: '🎩' },
];

const STYLE_CHIPS = [
  'Minimaliste',
  'Casual',
  'Élégant',
  'Streetwear',
  'Bohème',
  'Sportif',
  'Chic',
  'Rock',
];

type GenerationTier = 'standard' | 'premium' | 'luxe';

const TIERS: {
  value: GenerationTier;
  roman: string;
  label: string;
  tagline: string;
  features: string[];
}[] = [
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
    features: [
      'Analyse poussée des pièces',
      'Conseils de style détaillés',
      'Meilleures combinaisons',
    ],
  },
  {
    value: 'luxe',
    roman: 'III',
    label: 'LUXE',
    tagline: 'Expérience stylist haut de gamme',
    features: [
      'Curation experte sans compromis',
      'Storytelling de chaque tenue',
      'Résultats premium garantis',
    ],
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

// 4-step stepper labels for the form
const FORM_STEPS = ['Occasion', 'Style', 'Source', 'Budget'];

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
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.shoppingImage}
              contentFit="cover"
            />
            <View style={styles.shoppingInfo}>
              <Text style={styles.shoppingTitle} numberOfLines={2}>
                {product.title}
              </Text>
              <Text style={styles.shoppingPrice}>{product.price}</Text>
              <Text style={styles.shoppingStore} numberOfLines={1}>
                {product.store}
              </Text>
              <Text style={styles.shoppingCta}>VOIR →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Stepper component for the form
function FormStepper({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.stepper}>
      {FORM_STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <View key={label} style={styles.stepperItem}>
            <View
              style={[
                styles.stepperCircle,
                isActive && styles.stepperCircleActive,
                isDone && styles.stepperCircleDone,
              ]}
            >
              {isDone ? (
                <Ionicons name="checkmark" size={12} color="#00C4BF" />
              ) : (
                <Text style={[styles.stepperNum, isActive && styles.stepperNumActive]}>
                  {stepNum}
                </Text>
              )}
            </View>
            {i < FORM_STEPS.length - 1 && (
              <View style={[styles.stepperLine, isDone && styles.stepperLineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function StylistScreen() {
  const router = useRouter();
  const { weather, loading: weatherLoading } = useWeather();
  const carouselRef = useRef<FlatList<Outfit>>(null);

  const [step, setStep] = useState<Step>('form');
  const [formStep, setFormStep] = useState(1);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [occasionNote, setOccasionNote] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [tier, setTier] = useState<GenerationTier>('standard');
  const [composeMode, setComposeMode] = useState<ComposeMode>('dressing');
  const [budget, setBudget] = useState<number | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);

  const [karlProfile, setKarlProfile] = useState<StyleProfile | null>(null);

  useEffect(() => {
    void getStyleProfile().then(setKarlProfile);
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
      const tierNote =
        tier === 'premium'
          ? 'Génération premium — curation approfondie.'
          : tier === 'luxe'
            ? 'Génération luxe — expérience stylist haut de gamme, aucun compromis.'
            : undefined;
      const { id: briefId } = await createBrief({
        occasion,
        styleTags: selectedStyles.length > 0 ? selectedStyles : undefined,
        budget: budget ?? undefined,
        composeMode,
        weatherNote: weather?.note,
        styleNotes: occasionNote || tierNote,
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
            const msg = brief.errorMessage?.startsWith('[')
              ? 'Génération échouée. Réessaie.'
              : (brief.errorMessage ?? 'Génération échouée. Réessaie.');
            Alert.alert('Erreur', msg);
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
    setFormStep(1);
    setOccasion(null);
    setOccasionNote('');
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
          <Ionicons name="arrow-back" size={18} color="#00C4BF" />
          <Text style={styles.backText}>Retour aux tenues</Text>
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
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.outfitItemImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.outfitItemPlaceholder}>
                  <Ionicons name="shirt-outline" size={24} color="#A0AEC0" />
                </View>
              )}
              <Text style={styles.outfitItemCategory} numberOfLines={1}>
                {(CATEGORY_FR[item.category ?? ''] ?? item.category ?? '').toUpperCase()}
              </Text>
              <Text style={styles.outfitItemColor} numberOfLines={1}>
                {item.primaryColor}
              </Text>
            </View>
          ))}
        </View>

        {(selectedOutfit.shoppingResults?.length ?? 0) > 0 && (
          <ShoppingSection results={selectedOutfit.shoppingResults!} />
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btnWornWrap}
            onPress={() => handleAction(selectedOutfit, 'worn')}
          >
            <View style={styles.btnWorn}>
              <Text style={styles.btnPrimaryText}>JE LA PORTE</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnSave}
            onPress={() => handleAction(selectedOutfit, 'save')}
          >
            <Text style={styles.btnSecondaryText}>ENREGISTRER</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnDiscard}
            onPress={() => handleAction(selectedOutfit, 'discard')}
          >
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
        <ActivityIndicator size="large" color="#00C4BF" />
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
              {currentIndex + 1}
              <Text style={styles.resultsCounterMax}>/{outfits.length}</Text>
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
              <ScrollView
                contentContainerStyle={styles.carouselContent}
                showsVerticalScrollIndicator={false}
              >
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
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.outfitItemImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.outfitItemPlaceholder}>
                          <Ionicons name="shirt-outline" size={24} color="#A0AEC0" />
                        </View>
                      )}
                      <Text style={styles.outfitItemCategory} numberOfLines={1}>
                        {(CATEGORY_FR[item.category ?? ''] ?? item.category ?? '').toUpperCase()}
                      </Text>
                      <Text style={styles.outfitItemColor} numberOfLines={1}>
                        {item.primaryColor}
                      </Text>
                    </View>
                  ))}
                </View>

                {(outfit.shoppingResults?.length ?? 0) > 0 && (
                  <ShoppingSection results={outfit.shoppingResults!} />
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.btnWornWrap}
                    onPress={() => handleAction(outfit, 'worn')}
                  >
                    <View style={styles.btnWorn}>
                      <Text style={styles.btnPrimaryText}>JE LA PORTE</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnSave}
                    onPress={() => handleAction(outfit, 'save')}
                  >
                    <Text style={styles.btnSecondaryText}>ENREGISTRER</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnDiscard}
                    onPress={() => handleAction(outfit, 'discard')}
                  >
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

      {/* Form header */}
      <View style={styles.formHeaderGradient}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
            <Ionicons name="arrow-back" size={20} color="#0D1B2A" />
          </TouchableOpacity>
          <Text style={styles.formHeaderTitle}>Générer une tenue</Text>
        </View>
      </View>

      <FormStepper currentStep={formStep} />

      <Text style={styles.formTitle}>Quelle est l'occasion ?</Text>
      <Text style={styles.formSub}>Choisis ou décris ton occasion</Text>

      {/* Karl's memory card */}
      {karlProfile && (
        <View style={styles.karlCard}>
          <View style={styles.karlCardTop}>
            <View>
              <Text style={styles.karlCardLabel}>MÉMOIRE DE KARL</Text>
              <Text style={styles.karlCardTitle}>{karlProfile.styleConfidenceLabel}</Text>
            </View>
            <View style={styles.karlScoreBadge}>
              <Text style={styles.karlScoreText}>
                {Math.round(karlProfile.styleConfidence * 100)}%
              </Text>
            </View>
          </View>

          <View style={styles.karlBar}>
            <View
              style={[
                styles.karlBarFill,
                { width: `${Math.round(karlProfile.styleConfidence * 100)}%` },
              ]}
            />
          </View>

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
              Ajoutez plus de pièces et postez vos tenues pour que Karl affine sa connaissance de
              votre style.
            </Text>
          )}
        </View>
      )}

      {/* Occasion icons grid */}
      <Text style={styles.sectionLabel}>OCCASION *</Text>
      <View style={styles.occasionGrid}>
        {OCCASIONS.map((occ) => {
          const isActive = occasion === occ.value;
          return (
            <TouchableOpacity
              key={occ.value}
              style={[styles.occasionIconCard, isActive && styles.occasionIconCardActive]}
              onPress={() => setOccasion(occ.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.occasionIconEmoji}>{occ.icon}</Text>
              <Text
                style={[styles.occasionIconLabel, isActive && styles.occasionIconLabelActive]}
                numberOfLines={1}
              >
                {occ.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Occasion description */}
      <TextInput
        style={styles.occasionTextarea}
        placeholder="Décris ton occasion..."
        placeholderTextColor="#A0AEC0"
        value={occasionNote}
        onChangeText={setOccasionNote}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        keyboardAppearance="light"
      />

      {/* Style chips */}
      <Text style={styles.sectionLabel}>
        STYLE <Text style={styles.optional}>(optionnel)</Text>
      </Text>
      <View style={styles.chipGrid}>
        {STYLE_CHIPS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.styleChip, selectedStyles.includes(tag) && styles.styleChipActive]}
            onPress={() => toggleStyle(tag)}
          >
            <Text
              style={[
                styles.styleChipText,
                selectedStyles.includes(tag) && styles.styleChipTextActive,
              ]}
            >
              {tag}
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
              style={[
                styles.tierCard,
                active && styles.tierCardActive,
                isLuxe && active && styles.tierCardLuxeActive,
              ]}
              onPress={() => setTier(t.value)}
              activeOpacity={0.85}
            >
              <View style={styles.tierLeft}>
                <Text
                  style={[
                    styles.tierRoman,
                    active && styles.tierRomanActive,
                    isLuxe && active && styles.tierRomanLuxe,
                  ]}
                >
                  {t.roman}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierLabel, active && styles.tierLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={styles.tierTagline}>{t.tagline}</Text>
                  {active && (
                    <View style={styles.tierFeatures}>
                      {t.features.map((f, i) => (
                        <Text key={i} style={[styles.tierFeature, isLuxe && { color: '#00C4BF' }]}>
                          — {f}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <View
                style={[
                  styles.tierCheck,
                  active && styles.tierCheckActive,
                  isLuxe && active && styles.tierCheckLuxe,
                ]}
              >
                {active && (
                  <Text style={[styles.tierCheckMark, isLuxe && { color: '#FFFFFF' }]}>✓</Text>
                )}
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
            style={[
              styles.composeModeBtn,
              composeMode === mode.value && styles.composeModeBtnActive,
            ]}
            onPress={() => setComposeMode(mode.value)}
          >
            <Text
              style={[
                styles.composeModeLbl,
                composeMode === mode.value && styles.composeModeLblActive,
              ]}
            >
              {mode.label}
            </Text>
            <Text
              style={[
                styles.composeModeSubLbl,
                composeMode === mode.value && styles.composeModeSubLblActive,
              ]}
            >
              {mode.sub}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Budget */}
      <Text style={[styles.sectionLabel, { marginTop: spacing[4] }]}>
        BUDGET <Text style={styles.optional}>(optionnel)</Text>
      </Text>
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
            <Text
              style={[styles.budgetChipText, budget === opt.value && styles.budgetChipTextActive]}
            >
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
        style={styles.submitBtnWrap}
        onPress={handleSubmit}
        disabled={!occasion}
        activeOpacity={0.85}
      >
        {occasion ? (
          <View style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Suivant</Text>
          </View>
        ) : (
          <View style={[styles.submitBtn, styles.submitBtnDisabled]}>
            <Text style={[styles.submitBtnText, styles.submitBtnTextDisabled]}>Suivant</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    padding: spacing[5],
    paddingTop: spacing[16],
    paddingBottom: spacing[10],
  },

  // Back / header
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  backText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#00C4BF',
    fontSize: 13,
  },

  // Form header
  formHeaderGradient: {
    marginHorizontal: -spacing[5],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[16],
    paddingBottom: spacing[4],
    marginBottom: spacing[2],
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  formHeaderTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#0D1B2A',
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  stepperItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepperCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  stepperCircleActive: {
    backgroundColor: '#00C4BF',
    borderColor: '#00C4BF',
  },
  stepperCircleDone: {
    backgroundColor: '#FFFFFF',
    borderColor: '#00C4BF',
  },
  stepperNum: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#A0AEC0',
  },
  stepperNumActive: {
    color: '#FFFFFF',
  },
  stepperLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 2,
  },
  stepperLineDone: {
    backgroundColor: '#00C4BF',
  },

  // Form titles
  formTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#0D1B2A',
    marginBottom: spacing[1],
  },
  formSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#A0AEC0',
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  eyebrow: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#00C4BF',
    letterSpacing: 3,
  },

  // Section labels
  sectionLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#A0AEC0',
    letterSpacing: 2,
    marginTop: spacing[5],
    marginBottom: spacing[3],
  },
  optional: {
    fontFamily: 'Poppins_400Regular',
    color: '#A0AEC0',
    letterSpacing: 0,
    fontSize: 10,
  },

  // Occasion icons grid
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  occasionIconCard: {
    width: (SCREEN_WIDTH - spacing[5] * 2 - spacing[2] * 4) / 5,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    gap: 4,
    padding: spacing[1],
  },
  occasionIconCardActive: {
    backgroundColor: '#00C4BF',
  },
  occasionIconEmoji: {
    fontSize: 20,
  },
  occasionIconLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: '#00C4BF',
    textAlign: 'center',
  },
  occasionIconLabelActive: {
    color: '#FFFFFF',
  },

  // Occasion textarea
  occasionTextarea: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#0D1B2A',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: spacing[4],
    minHeight: 80,
    marginBottom: spacing[2],
  },

  // Style chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  styleChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
  },
  styleChipActive: {
    backgroundColor: '#00C4BF',
    borderColor: '#00C4BF',
  },
  styleChipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#A0AEC0',
  },
  styleChipTextActive: { color: '#FFFFFF' },

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
    borderColor: '#E2E8F0',
    backgroundColor: '#f8faff',
    padding: spacing[4],
    gap: spacing[3],
    borderRadius: 14,
  },
  tierCardActive: {
    borderColor: '#00C4BF',
    backgroundColor: 'rgba(0,196,191,0.06)',
  },
  tierCardLuxeActive: {
    borderColor: '#00C4BF',
    backgroundColor: 'rgba(0,196,191,0.12)',
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    flex: 1,
  },
  tierRoman: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#E2E8F0',
    lineHeight: 28,
    width: 24,
  },
  tierRomanActive: { color: '#00C4BF' },
  tierRomanLuxe: { color: '#00C4BF' },
  tierLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#A0AEC0',
    letterSpacing: 1,
    marginBottom: 3,
  },
  tierLabelActive: { color: '#0D1B2A' },
  tierTagline: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#A0AEC0',
  },
  tierRight: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  tierFeatures: {
    gap: 3,
    marginTop: spacing[1],
  },
  tierFeature: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: '#A0AEC0',
  },
  tierCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierCheckActive: {
    borderColor: '#00C4BF',
    backgroundColor: 'transparent',
  },
  tierCheckLuxe: {
    backgroundColor: '#00C4BF',
    borderColor: '#00C4BF',
  },
  tierCheckMark: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#00C4BF',
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
    borderColor: '#E2E8F0',
    backgroundColor: '#f8faff',
    gap: 4,
    borderRadius: 12,
  },
  composeModeBtnActive: {
    borderColor: '#00C4BF',
    backgroundColor: 'rgba(0,196,191,0.08)',
  },
  composeModeLbl: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#A0AEC0',
    letterSpacing: 1,
  },
  composeModeLblActive: { color: '#00C4BF' },
  composeModeSubLbl: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: '#A0AEC0',
    textAlign: 'center',
  },
  composeModeSubLblActive: { color: '#00C4BF' },

  // Budget
  budgetScroll: { marginBottom: spacing[2] },
  budgetScrollContent: { gap: spacing[2], paddingRight: spacing[5] },
  budgetChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
  },
  budgetChipActive: {
    backgroundColor: '#00C4BF',
    borderColor: '#00C4BF',
  },
  budgetChipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#A0AEC0',
  },
  budgetChipTextActive: { color: '#FFFFFF' },

  // Weather
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f8faff',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginTop: spacing[4],
    marginBottom: spacing[5],
    borderRadius: 10,
  },
  weatherIcon: { fontSize: 14, color: '#00C4BF' },
  weatherText: {
    fontFamily: 'Poppins_400Regular',
    flex: 1,
    fontSize: 12,
    color: '#A0AEC0',
  },

  // Submit
  submitBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitBtn: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#00C4BF',
  },
  submitBtnDisabled: { backgroundColor: '#E2E8F0' },
  submitBtnText: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 1,
  },
  submitBtnTextDisabled: { color: '#A0AEC0' },

  // Waiting
  waitingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  waitingTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#0D1B2A',
    letterSpacing: 4,
    marginTop: spacing[2],
  },
  waitingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#A0AEC0',
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },
  waitingSubText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#A0AEC0',
    letterSpacing: 1,
  },
  waitingKarlNote: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#00C4BF',
    letterSpacing: 1,
    marginTop: spacing[3],
  },

  // Karl card
  karlCard: {
    backgroundColor: '#f8faff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[2],
    borderRadius: 16,
  },
  karlCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  karlCardLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#00C4BF',
    letterSpacing: 2,
    marginBottom: 4,
  },
  karlCardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#0D1B2A',
    maxWidth: 220,
  },
  karlScoreBadge: {
    borderWidth: 1,
    borderColor: '#00C4BF',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  karlScoreText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#00C4BF',
    letterSpacing: 1,
  },
  karlBar: {
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  karlBarFill: {
    height: 3,
    backgroundColor: '#00C4BF',
    borderRadius: 2,
  },
  karlKnowledge: {
    gap: spacing[2],
  },
  karlKnowledgeRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  karlKnowledgeKey: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: '#A0AEC0',
    width: 52,
    textTransform: 'uppercase',
    paddingTop: 1,
  },
  karlKnowledgeVal: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#0D1B2A',
    flex: 1,
  },
  karlSignals: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: spacing[3],
    gap: spacing[2],
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  karlSignal: { alignItems: 'center', gap: 2 },
  karlSignalValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#00C4BF',
    lineHeight: 22,
  },
  karlSignalLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: '#A0AEC0',
  },
  karlSignalDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  karlTip: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#A0AEC0',
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // Results
  resultsHeader: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[16],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: spacing[1],
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  resultsTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#0D1B2A',
  },
  resultsCounter: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#00C4BF',
  },
  resultsCounterMax: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#A0AEC0',
  },
  carouselPage: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  carouselContent: {
    paddingHorizontal: spacing[5],
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
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#A0AEC0',
    letterSpacing: 2,
  },
  scoreChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#00C4BF',
    borderRadius: 8,
  },
  scoreValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#00C4BF',
    letterSpacing: 1,
  },
  outfitJustif: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#A0AEC0',
    lineHeight: 22,
    marginBottom: spacing[4],
    fontStyle: 'italic',
  },

  // Detail
  detailTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#0D1B2A',
    marginBottom: spacing[2],
  },
  justification: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#A0AEC0',
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
    backgroundColor: '#f8faff',
    borderRadius: 8,
  },
  outfitItemPlaceholder: {
    width: 80,
    height: 100,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outfitItemCategory: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 8,
    color: '#A0AEC0',
    letterSpacing: 1,
    textAlign: 'center',
  },
  outfitItemColor: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 8,
    color: '#A0AEC0',
    textAlign: 'center',
    textTransform: 'capitalize',
  },

  // Shopping
  shoppingSection: { marginBottom: spacing[5] },
  shoppingSectionLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#A0AEC0',
    letterSpacing: 2,
    marginBottom: spacing[3],
  },
  shoppingScroll: { gap: spacing[3], paddingRight: spacing[2] },
  shoppingCard: {
    width: 150,
    backgroundColor: '#f8faff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    borderRadius: 12,
  },
  shoppingImage: { width: 150, height: 150 },
  shoppingInfo: { padding: spacing[3], gap: spacing[1] },
  shoppingTitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#0D1B2A',
    lineHeight: 16,
  },
  shoppingPrice: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#00C4BF',
  },
  shoppingStore: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#A0AEC0',
  },
  shoppingCta: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#00C4BF',
    letterSpacing: 1,
    marginTop: 2,
  },

  // Actions
  actions: { gap: spacing[3] },
  btnWornWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnWorn: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#00C4BF',
  },
  btnSave: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
  },
  btnDiscard: {
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 2,
  },
  btnSecondaryText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#0D1B2A',
    fontSize: 13,
    letterSpacing: 1,
  },
  btnDiscardText: {
    fontFamily: 'Poppins_400Regular',
    color: '#A0AEC0',
    fontSize: 13,
  },
  detailLink: {
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    color: '#00C4BF',
    fontSize: 13,
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
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  dotActive: {
    width: 32,
    backgroundColor: '#00C4BF',
    borderRadius: 2,
  },
  newBriefBtn: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[6],
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
  },
  newBriefText: {
    fontFamily: 'Poppins_700Bold',
    color: '#A0AEC0',
    fontSize: 13,
    letterSpacing: 2,
  },
});

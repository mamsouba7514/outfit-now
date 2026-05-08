import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@outfit-now/design-tokens';
import type { DressingItem } from '@outfit-now/shared-types';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Ellipse,
  Path,
  Rect,
  Circle,
  Defs,
  RadialGradient,
  Stop,
  LinearGradient,
} from 'react-native-svg';

import { useAppTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../hooks/useAuth';
import {
  getAvatar,
  saveAvatar,
  getAvatarPhotoUploadUrl,
  generateAvatarImage,
  analyzeAvatarPhoto,
  type AvatarData,
  type AvatarUpdatePayload,
} from '../../lib/avatar';
import { getDressingItems } from '../../lib/dressing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MANNEQUIN_HEIGHT = SCREEN_HEIGHT * 0.52;
const MANNEQUIN_WIDTH = SCREEN_WIDTH;

// ─── Types ────────────────────────────────────────────────────────────────────

type BodyType = AvatarData['bodyType'];
type SkinTone = AvatarData['skinTone'];
type HairColor = AvatarData['hairColor'];
type HairLength = AvatarData['hairLength'];
type Step = 'silhouette' | 'style' | 'ready';

// ─── Config ───────────────────────────────────────────────────────────────────

const BODY_TYPES: { value: BodyType; label: string; desc: string }[] = [
  { value: 'slim', label: 'SVELTE', desc: 'Fine et allongée' },
  { value: 'athletic', label: 'ATHLÉTIQUE', desc: 'Épaules larges' },
  { value: 'regular', label: 'REGULAR', desc: 'Proportions équilibrées' },
  { value: 'curvy', label: 'CURVY', desc: 'Formes généreuses' },
  { value: 'plus', label: 'PLUS SIZE', desc: 'Pleine et assumée' },
];

const SKIN_TONES: { value: SkinTone; label: string; hex: string }[] = [
  { value: 'light', label: 'Claire', hex: '#FDDBB4' },
  { value: 'medium-light', label: 'Lumineuse', hex: '#E8B98A' },
  { value: 'medium', label: 'Dorée', hex: '#C68642' },
  { value: 'medium-dark', label: 'Ambrée', hex: '#8D5524' },
  { value: 'dark', label: 'Ébène', hex: '#3D1C02' },
];

const HAIR_COLORS: { value: HairColor; label: string; hex: string }[] = [
  { value: 'black', label: 'Noirs', hex: '#1A1A1A' },
  { value: 'brown', label: 'Bruns', hex: '#6B3A2A' },
  { value: 'blonde', label: 'Blonds', hex: '#C9A84C' },
  { value: 'red', label: 'Roux', hex: '#A0522D' },
  { value: 'grey', label: 'Gris', hex: '#8C8C8C' },
  { value: 'white', label: 'Blancs', hex: '#E8E8E8' },
  { value: 'other', label: 'Autre', hex: '#555' },
];

const HAIR_LENGTHS: { value: HairLength; label: string }[] = [
  { value: 'shaved', label: 'RASÉ' },
  { value: 'short', label: 'COURT' },
  { value: 'medium', label: 'MI-LONG' },
  { value: 'long', label: 'LONG' },
];

const HEIGHTS = [
  150, 155, 158, 160, 163, 165, 168, 170, 173, 175, 178, 180, 183, 185, 188, 190, 195,
];

// ─── Category → body zone color mapping ──────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  tops: 'rgba(100,120,200,0.55)',
  bottoms: 'rgba(60,140,100,0.55)',
  dresses: 'rgba(180,80,140,0.55)',
  outerwear: 'rgba(140,100,60,0.55)',
  shoes: 'rgba(80,80,80,0.55)',
  accessories: 'rgba(196,154,46,0.65)',
  bags: 'rgba(180,120,80,0.55)',
  swimwear: 'rgba(40,160,180,0.55)',
  activewear: 'rgba(60,180,80,0.55)',
  underwear: 'rgba(200,140,140,0.45)',
};

// ─── Fashion Mannequin SVG ────────────────────────────────────────────────────

function FashionMannequin({
  bodyType,
  skinTone,
  hairColor,
  hairLength,
  wardrobeItems,
  photoUrl: _photoUrl,
}: {
  bodyType: BodyType;
  skinTone: SkinTone;
  hairColor: HairColor;
  hairLength: HairLength;
  wardrobeItems: DressingItem[];
  photoUrl: string | null;
}) {
  const skin = SKIN_TONES.find((s) => s.value === skinTone)?.hex ?? '#C68642';
  const hair = HAIR_COLORS.find((h) => h.value === hairColor)?.hex ?? '#6B3A2A';

  // Proportions par morphologie (viewBox 200x400)
  const cx = 100;
  const shW =
    bodyType === 'slim'
      ? 44
      : bodyType === 'athletic'
        ? 62
        : bodyType === 'curvy'
          ? 58
          : bodyType === 'plus'
            ? 68
            : 52; // épaule demi-largeur
  const waistW =
    bodyType === 'slim'
      ? 28
      : bodyType === 'athletic'
        ? 38
        : bodyType === 'curvy'
          ? 36
          : bodyType === 'plus'
            ? 52
            : 34;
  const hipW =
    bodyType === 'curvy'
      ? 66
      : bodyType === 'plus'
        ? 76
        : bodyType === 'slim'
          ? 40
          : bodyType === 'athletic'
            ? 52
            : 56;
  const legW = bodyType === 'plus' ? 24 : bodyType === 'curvy' ? 20 : 16;

  // Détection des catégories portées
  const cats = new Set(wardrobeItems.map((i) => i.category));
  const hasTop = cats.has('tops') || cats.has('activewear');
  const hasBottom = cats.has('bottoms');
  const hasDress = cats.has('dresses');
  const hasOuter = cats.has('outerwear');
  const hasShoes = cats.has('shoes');
  const hasAccessory = cats.has('accessories') || cats.has('bags');

  const topColor = CATEGORY_COLORS['tops'];
  const bottomColor = CATEGORY_COLORS['bottoms'];
  const dressColor = CATEGORY_COLORS['dresses'];
  const outerColor = CATEGORY_COLORS['outerwear'];
  const shoeColor = CATEGORY_COLORS['shoes'];

  const svgH = 400;
  const svgW = 200;

  return (
    <Svg
      width={MANNEQUIN_WIDTH * 0.65}
      height={MANNEQUIN_HEIGHT}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ alignSelf: 'center' }}
    >
      <Defs>
        <RadialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor={skin} stopOpacity="1" />
          <Stop offset="100%" stopColor={skin} stopOpacity="0.75" />
        </RadialGradient>
        <LinearGradient id="shadowGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#000" stopOpacity="0.15" />
          <Stop offset="50%" stopColor="#000" stopOpacity="0" />
          <Stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </LinearGradient>
        <LinearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.primary[300]} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.primary[600]} stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* ── Ombre au sol ── */}
      <Ellipse cx={cx} cy={392} rx={38} ry={5} fill="#000" opacity={0.18} />

      {/* ── Cheveux (fond) ── */}
      {hairLength !== 'shaved' && (
        <Ellipse
          cx={cx}
          cy={54}
          rx={hairLength === 'long' ? 26 : hairLength === 'medium' ? 24 : 22}
          ry={hairLength === 'long' ? 60 : hairLength === 'medium' ? 50 : 34}
          fill={hair}
        />
      )}

      {/* ── Cou ── */}
      <Rect x={cx - 7} y={90} width={14} height={20} rx={5} fill="url(#skinGrad)" />

      {/* ── Corps – trapèze épaules→taille ── */}
      <Path
        d={`
          M ${cx - shW} 106
          Q ${cx - shW - 6} 108 ${cx - shW - 4} 115
          L ${cx - waistW} 185
          Q ${cx} 194 ${cx + waistW} 185
          L ${cx + shW + 4} 115
          Q ${cx + shW + 6} 108 ${cx + shW} 106
          Z
        `}
        fill="url(#skinGrad)"
      />

      {/* ── Corps – taille→hanches ── */}
      <Path
        d={`
          M ${cx - waistW} 185
          Q ${cx - hipW} 196 ${cx - hipW} 212
          L ${cx - hipW + 4} 240
          L ${cx + hipW - 4} 240
          L ${cx + hipW} 212
          Q ${cx + hipW} 196 ${cx + waistW} 185
          Z
        `}
        fill="url(#skinGrad)"
      />

      {/* ── Jambes ── */}
      <Path
        d={`M ${cx - hipW + 4} 240 Q ${cx - legW * 2.2} 290 ${cx - legW * 2} 385`}
        stroke={skin}
        strokeWidth={legW * 2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M ${cx + hipW - 4} 240 Q ${cx + legW * 2.2} 290 ${cx + legW * 2} 385`}
        stroke={skin}
        strokeWidth={legW * 2}
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Bras ── */}
      <Path
        d={`M ${cx - shW - 2} 112 Q ${cx - shW - 22} 158 ${cx - shW - 16} 210`}
        stroke={skin}
        strokeWidth={15}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M ${cx + shW + 2} 112 Q ${cx + shW + 22} 158 ${cx + shW + 16} 210`}
        stroke={skin}
        strokeWidth={15}
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Tête ── */}
      <Ellipse cx={cx} cy={58} rx={22} ry={28} fill="url(#skinGrad)" />

      {/* ── Cheveux (dessus) ── */}
      {hairLength !== 'shaved' && (
        <>
          <Ellipse cx={cx} cy={34} rx={22} ry={14} fill={hair} />
          {(hairLength === 'medium' || hairLength === 'long') && (
            <Path
              d={`M ${cx - 22} 44 Q ${cx - 28} 32 ${cx} 28 Q ${cx + 28} 32 ${cx + 22} 44`}
              fill={hair}
            />
          )}
        </>
      )}

      {/* ── Visage ── */}
      {/* Yeux */}
      <Ellipse cx={cx - 8} cy={57} rx={3} ry={3.5} fill="#1A0A00" />
      <Ellipse cx={cx + 8} cy={57} rx={3} ry={3.5} fill="#1A0A00" />
      {/* Reflet */}
      <Circle cx={cx - 7} cy={55.5} r={1} fill="white" opacity={0.6} />
      <Circle cx={cx + 9} cy={55.5} r={1} fill="white" opacity={0.6} />
      {/* Nez */}
      <Path
        d={`M ${cx} 61 Q ${cx - 2} 66 ${cx} 67 Q ${cx + 2} 66 ${cx} 61`}
        fill={skin}
        opacity={0.5}
      />
      {/* Lèvres */}
      <Path
        d={`M ${cx - 6} 72 Q ${cx} 76 ${cx + 6} 72`}
        stroke="#9B5C4A"
        strokeWidth={1.5}
        fill="none"
      />

      {/* ── Ombre sur corps ── */}
      <Path
        d={`M ${cx - shW} 106 L ${cx - waistW} 185 L ${cx - hipW + 4} 240 L ${cx - hipW} 212 Q ${cx - hipW} 196 ${cx - waistW} 185 L ${cx - shW - 4} 115 Z`}
        fill="url(#shadowGrad)"
        opacity={0.5}
      />

      {/* ════════════════════════════════════════════
          COUCHES VÊTEMENTS (si articles dans dressing)
          ════════════════════════════════════════════ */}

      {/* Haut */}
      {(hasTop || hasDress) && !hasOuter && (
        <Path
          d={`
            M ${cx - shW + 2} 108
            Q ${cx - shW - 4} 110 ${cx - shW - 2} 117
            L ${cx - waistW + 2} 183
            Q ${cx} 192 ${cx + waistW - 2} 183
            L ${cx + shW + 2} 117
            Q ${cx + shW + 4} 110 ${cx + shW - 2} 108
            Z
          `}
          fill={hasDress ? dressColor : topColor}
          opacity={0.85}
        />
      )}

      {/* Bas */}
      {(hasBottom || hasDress) && (
        <Path
          d={`
            M ${cx - waistW} 184
            Q ${cx - hipW} 196 ${cx - hipW} 212
            L ${cx - legW * 2 + 2} 305
            L ${cx + legW * 2 - 2} 305
            L ${cx + hipW} 212
            Q ${cx + hipW} 196 ${cx + waistW} 184
            Z
          `}
          fill={hasDress ? dressColor : bottomColor}
          opacity={0.8}
        />
      )}

      {/* Manteau */}
      {hasOuter && (
        <Path
          d={`
            M ${cx - shW - 4} 106
            Q ${cx - shW - 10} 110 ${cx - shW - 8} 118
            L ${cx - waistW - 4} 186
            Q ${cx} 196 ${cx + waistW + 4} 186
            L ${cx + shW + 8} 118
            Q ${cx + shW + 10} 110 ${cx + shW + 4} 106
            Z
          `}
          fill={outerColor}
          opacity={0.88}
        />
      )}

      {/* Chaussures */}
      {hasShoes && (
        <>
          <Ellipse cx={cx - legW * 2 + 2} cy={385} rx={12} ry={6} fill={shoeColor} />
          <Ellipse cx={cx + legW * 2 - 2} cy={385} rx={12} ry={6} fill={shoeColor} />
        </>
      )}

      {/* Accessoire – collier/ceinture */}
      {hasAccessory && (
        <>
          <Path
            d={`M ${cx - 14} 92 Q ${cx} 96 ${cx + 14} 92`}
            stroke={colors.primary[400]}
            strokeWidth={2}
            fill="none"
            opacity={0.9}
          />
          <Circle cx={cx} cy={96} r={2} fill={colors.primary[400]} opacity={0.9} />
        </>
      )}

      {/* ── Ligne d'or décorative ── */}
      <Path
        d={`M ${cx - 60} 400 L ${cx + 60} 400`}
        stroke="url(#goldGrad)"
        strokeWidth={1}
        opacity={0.4}
      />
    </Svg>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function AvatarScreen() {
  const insets = useSafeAreaInsets();
  useAuthStore();
  const theme = useAppTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [step, setStep] = useState<Step>('silhouette');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [, setHasChanges] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState<DressingItem[]>([]);

  // Avatar state
  const [bodyType, setBodyType] = useState<BodyType>('regular');
  const [skinTone, setSkinTone] = useState<SkinTone>('medium');
  const [hairColor, setHairColor] = useState<HairColor>('brown');
  const [hairLength, setHairLength] = useState<HairLength>('medium');
  const [heightCm, setHeightCm] = useState<number>(170);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const savedRef = useRef<AvatarUpdatePayload>({});

  // Pulse animation for ready state
  useEffect(() => {
    if (step === 'ready') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [step]);

  useEffect(() => {
    Promise.all([getAvatar(), getDressingItems({ pageSize: 50 })])
      .then(([avatarData, dressingData]) => {
        if (avatarData) {
          setBodyType(avatarData.bodyType);
          setSkinTone(avatarData.skinTone);
          setHairColor(avatarData.hairColor);
          setHairLength(avatarData.hairLength);
          setHeightCm(avatarData.heightCm ?? 170);
          setPhotoUrl(avatarData.photoUrl);
          setPhotoKey(avatarData.photoKey);
          if (avatarData.generatedUrl) setGeneratedUrl(avatarData.generatedUrl);
          savedRef.current = {
            bodyType: avatarData.bodyType,
            skinTone: avatarData.skinTone,
            hairColor: avatarData.hairColor,
            hairLength: avatarData.hairLength,
            heightCm: avatarData.heightCm ?? 170,
          };
          // Si déjà configuré → aller directement à "ready"
          setStep('ready');
        }
        setWardrobeItems(dressingData.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const markChanged = () => setHasChanges(true);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateAvatarImage();
      setGeneratedUrl(result.generatedUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Génération échouée';
      if (msg.includes('NO_API_KEY') || msg.includes('REPLICATE_API_TOKEN')) {
        Alert.alert(
          'Clé API manquante',
          'Ajoute ta clé REPLICATE_API_TOKEN dans apps/api/.env pour activer la génération IA.\n\nObtiens-la gratuitement sur replicate.com',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Erreur de génération', msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAvatar({
        bodyType,
        skinTone,
        hairColor,
        hairLength,
        heightCm,
        ...(photoKey ? { photoKey } : {}),
      });
      savedRef.current = { bodyType, skinTone, hairColor, hairLength, heightCm };
      setHasChanges(false);
      setStep('ready');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Vérifie ta connexion.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée', "Autorise l'accès à tes photos dans les réglages.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    setPhotoUploading(true);
    try {
      const asset = result.assets[0];
      const { uploadUrl, key } = await getAvatarPhotoUploadUrl('image/jpeg');
      const blob = await fetch(asset.uri).then((r) => r.blob());
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });
      setPhotoUrl(asset.uri);
      setPhotoKey(key);
      markChanged();

      // Auto-analyse Claude Haiku — détecte morphologie, peau, cheveux
      setAnalyzing(true);
      setAnalysisResult(null);
      try {
        const { analysis, autoApplied } = await analyzeAvatarPhoto();
        if (autoApplied) {
          setBodyType(analysis.bodyType);
          setSkinTone(analysis.skinTone);
          setHairColor(analysis.hairColor);
          setHairLength(analysis.hairLength);
          setAnalysisResult(
            `✓ Karl a détecté ta morphologie — confiance ${Math.round(analysis.confidence * 100)}%`,
          );
        } else {
          setAnalysisResult('Photo reçue. Vérifie et ajuste les champs si besoin.');
        }
      } catch {
        setAnalysisResult('Analyse manuelle requise.');
      } finally {
        setAnalyzing(false);
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'uploader la photo.");
    } finally {
      setPhotoUploading(false);
    }
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.root,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary[400]} />
      </View>
    );
  }

  // ─── Étape PRÊT ──────────────────────────────────────────────────────────
  if (step === 'ready') {
    const categoryCount = new Set(wardrobeItems.map((i) => i.category)).size;
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 8, borderBottomColor: theme.colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            MON MANNEQUIN
          </Text>
          <TouchableOpacity
            onPress={() => {
              setStep('silhouette');
              setHasChanges(false);
            }}
          >
            <Text style={styles.editBtn}>MODIFIER</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Mannequin principal ── */}
          <Animated.View
            style={[
              styles.mannequinStage,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {generatedUrl ? (
              /* ── VUE PHOTO IA ── */
              <>
                <Image
                  source={{ uri: generatedUrl }}
                  style={styles.generatedPhoto}
                  contentFit="cover"
                  transition={400}
                />
                {/* Overlay badges */}
                <View style={styles.heightBadge}>
                  <Text style={styles.heightBadgeText}>{heightCm} cm</Text>
                </View>
                <View style={styles.morphBadge}>
                  <Text style={styles.morphBadgeText}>
                    {BODY_TYPES.find((b) => b.value === bodyType)?.label ?? 'REGULAR'}
                  </Text>
                </View>
                <View style={styles.iaBadge}>
                  <Ionicons name="sparkles" size={8} color={colors.primary[400]} />
                  <Text style={styles.iaBadgeText}>GÉNÉRÉ PAR IA</Text>
                </View>
                {/* Regenerate button */}
                <TouchableOpacity
                  style={styles.regenBtn}
                  onPress={handleGenerate}
                  disabled={generating}
                  activeOpacity={0.8}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color={theme.colors.textPrimary} />
                  ) : (
                    <Ionicons name="refresh" size={16} color={theme.colors.textPrimary} />
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* ── VUE SVG (avant génération) ── */
              <>
                <View style={styles.heightBadge}>
                  <Text style={styles.heightBadgeText}>{heightCm} cm</Text>
                </View>
                {photoUrl && (
                  <View style={styles.selfieFrame}>
                    <Image source={{ uri: photoUrl }} style={styles.selfieImg} contentFit="cover" />
                    <View style={styles.selfieBadge}>
                      <Text style={styles.selfieBadgeText}>SELFIE</Text>
                    </View>
                  </View>
                )}
                <FashionMannequin
                  bodyType={bodyType}
                  skinTone={skinTone}
                  hairColor={hairColor}
                  hairLength={hairLength}
                  wardrobeItems={wardrobeItems}
                  photoUrl={photoUrl}
                />
                <View style={styles.morphBadge}>
                  <Text style={styles.morphBadgeText}>
                    {BODY_TYPES.find((b) => b.value === bodyType)?.label ?? 'REGULAR'}
                  </Text>
                </View>

                {/* Bouton génération IA */}
                <TouchableOpacity
                  style={styles.generateOverlayBtn}
                  onPress={handleGenerate}
                  disabled={generating}
                  activeOpacity={0.85}
                >
                  {generating ? (
                    <>
                      <ActivityIndicator size="small" color={theme.colors.textPrimary} />
                      <Text style={styles.generateOverlayBtnText}>GÉNÉRATION EN COURS…</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={14} color={theme.colors.textPrimary} />
                      <Text style={styles.generateOverlayBtnText}>
                        GÉNÉRER MON VRAI MANNEQUIN IA
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          {/* Stats dressing */}
          <View
            style={[
              styles.statsRow,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{wardrobeItems.length}</Text>
              <Text style={styles.statLabel}>PIÈCES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{categoryCount}</Text>
              <Text style={styles.statLabel}>CATÉGORIES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{heightCm}</Text>
              <Text style={styles.statLabel}>CM</Text>
            </View>
          </View>

          {/* Légende des zones */}
          {wardrobeItems.length > 0 && (
            <View style={styles.legendSection}>
              <Text style={styles.legendTitle}>VÊTEMENTS PORTÉS</Text>
              <View style={styles.legendGrid}>
                {Array.from(new Set(wardrobeItems.map((i) => i.category))).map((cat) => (
                  <View key={cat} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: CATEGORY_COLORS[cat] ?? '#888' },
                      ]}
                    />
                    <Text style={styles.legendText}>{cat.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {wardrobeItems.length === 0 && (
            <View style={[styles.emptyDressingCard, { borderColor: theme.colors.border }]}>
              <Ionicons name="shirt-outline" size={24} color={theme.colors.textMuted} />
              <Text style={[styles.emptyDressingText, { color: theme.colors.textMuted }]}>
                Ajoute des vêtements à ton dressing pour les voir sur ton mannequin.
              </Text>
              <TouchableOpacity
                style={[styles.emptyDressingBtn, { borderColor: theme.colors.border }]}
                onPress={() => router.push('/(app)/dressing' as never)}
              >
                <Text style={[styles.emptyDressingBtnText, { color: theme.colors.textSecondary }]}>
                  OUVRIR LE DRESSING →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Try-on teaser */}
          <View style={styles.tryonCard}>
            <View style={styles.tryonCardTop}>
              <Ionicons name="sparkles" size={18} color={colors.primary[400]} />
              <Text style={[styles.tryonCardTitle, { color: theme.colors.textPrimary }]}>
                ESSAYAGE VIRTUEL IA
              </Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>BIENTÔT</Text>
              </View>
            </View>
            <Text style={styles.tryonCardDesc}>
              Génère des tenues complètes portées par ton mannequin personnel grâce à l'IA.
              Disponible avec l'abonnement Premium.
            </Text>
          </View>

          {/* Photo selfie button */}
          <TouchableOpacity
            style={[styles.photoSelfieBtn, { borderColor: theme.colors.border }]}
            onPress={handlePickPhoto}
            disabled={photoUploading}
            activeOpacity={0.8}
          >
            {photoUploading ? (
              <ActivityIndicator size="small" color={colors.primary[400]} />
            ) : (
              <>
                <Ionicons
                  name={photoUrl ? 'camera' : 'camera-outline'}
                  size={16}
                  color={colors.primary[400]}
                />
                <Text style={styles.photoSelfieBtnText}>
                  {photoUrl ? 'CHANGER MON SELFIE' : 'AJOUTER UN SELFIE'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── Étapes de création ───────────────────────────────────────────────────

  const steps: { key: Step; label: string }[] = [
    { key: 'silhouette', label: 'SILHOUETTE' },
    { key: 'style', label: 'STYLE' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: theme.colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (step === 'silhouette') router.back();
            else setStep('silhouette');
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>TON MANNEQUIN</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Progress */}
      <View style={[styles.progressRow, { borderBottomColor: theme.colors.border }]}>
        {steps.map((s, _i) => (
          <TouchableOpacity key={s.key} style={styles.progressStep} onPress={() => setStep(s.key)}>
            <View
              style={[
                styles.progressDot,
                { backgroundColor: theme.colors.textMuted },
                step === s.key && styles.progressDotActive,
              ]}
            />
            <Text
              style={[
                styles.progressLabel,
                { color: theme.colors.textMuted },
                step === s.key && styles.progressLabelActive,
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Aperçu mannequin (compact, en haut) */}
        <View
          style={[
            styles.previewCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.heightBadge}>
            <Text style={styles.heightBadgeText}>{heightCm} cm</Text>
          </View>
          <FashionMannequin
            bodyType={bodyType}
            skinTone={skinTone}
            hairColor={hairColor}
            hairLength={hairLength}
            wardrobeItems={wardrobeItems}
            photoUrl={null}
          />
        </View>

        {/* ── ÉTAPE 1 : SILHOUETTE ── */}
        {step === 'silhouette' && (
          <>
            <Text style={styles.sectionEye}>ÉTAPE 1 — SILHOUETTE</Text>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              MORPHOLOGIE
            </Text>
            <View style={styles.bodyTypeGrid}>
              {BODY_TYPES.map((bt) => (
                <TouchableOpacity
                  key={bt.value}
                  style={[
                    styles.bodyTypeCard,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    bodyType === bt.value && styles.bodyTypeCardActive,
                  ]}
                  onPress={() => {
                    setBodyType(bt.value);
                    markChanged();
                  }}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text
                      style={[
                        styles.bodyTypeLabel,
                        { color: theme.colors.textMuted },
                        bodyType === bt.value && styles.bodyTypeLabelActive,
                      ]}
                    >
                      {bt.label}
                    </Text>
                    <Text style={[styles.bodyTypeDesc, { color: theme.colors.textMuted }]}>
                      {bt.desc}
                    </Text>
                  </View>
                  {bodyType === bt.value && (
                    <Ionicons name="checkmark" size={16} color={colors.primary[400]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>TAILLE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.heightScroll}
              contentContainerStyle={styles.heightScrollContent}
            >
              {HEIGHTS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.heightChip,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    heightCm === h && styles.heightChipActive,
                  ]}
                  onPress={() => {
                    setHeightCm(h);
                    markChanged();
                  }}
                >
                  <Text
                    style={[
                      styles.heightChipText,
                      { color: theme.colors.textMuted },
                      heightCm === h && styles.heightChipTextActive,
                    ]}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.nextBtn, { borderColor: theme.colors.border }]}
              onPress={() => setStep('style')}
              activeOpacity={0.85}
            >
              <Text style={[styles.nextBtnText, { color: theme.colors.textPrimary }]}>
                ÉTAPE SUIVANTE →
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── ÉTAPE 2 : STYLE ── */}
        {step === 'style' && (
          <>
            <Text style={styles.sectionEye}>ÉTAPE 2 — STYLE</Text>

            {/* Bannière résultat analyse photo */}
            {(analyzing || analysisResult) && (
              <View style={styles.analysisBanner}>
                {analyzing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                    <ActivityIndicator size="small" color={colors.primary[500]} />
                    <Text style={styles.analysisBannerText}>Karl analyse ta photo…</Text>
                  </View>
                ) : (
                  <Text style={styles.analysisBannerText}>{analysisResult}</Text>
                )}
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              TEINTE DE PEAU
            </Text>
            <View style={styles.swatchRow}>
              {SKIN_TONES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  onPress={() => {
                    setSkinTone(s.value);
                    markChanged();
                  }}
                  style={styles.swatchBtn}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: s.hex },
                      skinTone === s.value && styles.swatchActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.swatchLabel,
                      { color: theme.colors.textMuted },
                      skinTone === s.value && [
                        styles.swatchLabelActive,
                        { color: theme.colors.textPrimary },
                      ],
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              COULEUR DES CHEVEUX
            </Text>
            <View style={styles.swatchRow}>
              {HAIR_COLORS.map((h) => (
                <TouchableOpacity
                  key={h.value}
                  onPress={() => {
                    setHairColor(h.value);
                    markChanged();
                  }}
                  style={styles.swatchBtn}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: h.hex,
                        borderColor: h.value === 'white' ? theme.colors.textMuted : 'transparent',
                      },
                      hairColor === h.value && styles.swatchActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.swatchLabel,
                      { color: theme.colors.textMuted },
                      hairColor === h.value && [
                        styles.swatchLabelActive,
                        { color: theme.colors.textPrimary },
                      ],
                    ]}
                  >
                    {h.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              LONGUEUR DES CHEVEUX
            </Text>
            <View style={styles.hairLengthRow}>
              {HAIR_LENGTHS.map((hl) => (
                <TouchableOpacity
                  key={hl.value}
                  style={[
                    styles.hairLengthBtn,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    hairLength === hl.value && styles.hairLengthBtnActive,
                  ]}
                  onPress={() => {
                    setHairLength(hl.value);
                    markChanged();
                  }}
                >
                  <Text
                    style={[
                      styles.hairLengthText,
                      { color: theme.colors.textMuted },
                      hairLength === hl.value && styles.hairLengthTextActive,
                    ]}
                  >
                    {hl.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              PHOTO PERSONNELLE
            </Text>
            <TouchableOpacity
              style={[
                styles.photoFullBtn,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={handlePickPhoto}
              disabled={photoUploading}
              activeOpacity={0.8}
            >
              {photoUploading ? (
                <ActivityIndicator size="small" color={colors.primary[400]} />
              ) : photoUrl ? (
                <View style={styles.photoPreviewRow}>
                  <Image source={{ uri: photoUrl }} style={styles.photoThumb} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.photoFullBtnText}>SELFIE AJOUTÉ ✓</Text>
                    <Text style={[styles.photoHint, { color: theme.colors.textMuted }]}>
                      Améliore la précision de l'essayage virtuel
                    </Text>
                  </View>
                  <Ionicons name="camera" size={18} color={colors.primary[400]} />
                </View>
              ) : (
                <View style={styles.photoPreviewRow}>
                  <View style={[styles.photoPlaceholder, { borderColor: theme.colors.border }]}>
                    <Ionicons name="camera-outline" size={20} color={theme.colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.photoFullBtnText}>AJOUTER UN SELFIE</Text>
                    <Text style={[styles.photoHint, { color: theme.colors.textMuted }]}>
                      Optionnel — améliore les résultats IA
                    </Text>
                  </View>
                  <Ionicons name="add" size={18} color={theme.colors.textMuted} />
                </View>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Bouton Générer / Sauvegarder */}
      <View
        style={[
          styles.saveBar,
          {
            paddingBottom: insets.bottom + 8,
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={theme.colors.textPrimary} />
              <Text style={styles.saveBtnText}>CRÉER MON MANNEQUIN</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral[950] },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: 3,
  },
  editBtn: {
    fontSize: 10,
    color: colors.primary[400],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.bold,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    gap: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[900],
  },
  progressStep: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[700],
  },
  progressDotActive: { backgroundColor: colors.primary[400] },
  progressLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.bold,
  },
  progressLabelActive: { color: colors.primary[400] },

  content: { paddingHorizontal: spacing[4], paddingTop: spacing[4] },

  // Mannequin preview (compact, dans les étapes)
  previewCard: {
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    alignItems: 'center',
    paddingVertical: spacing[4],
    marginBottom: spacing[5],
    position: 'relative',
  },

  // Mannequin stage (écran ready)
  mannequinStage: {
    backgroundColor: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    alignItems: 'center',
    paddingVertical: spacing[6],
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    position: 'relative',
    overflow: 'hidden',
    minHeight: MANNEQUIN_HEIGHT,
    borderRadius: 16,
  },
  // Photo IA générée
  generatedPhoto: {
    width: '100%',
    height: MANNEQUIN_HEIGHT,
    resizeMode: 'cover',
  },
  iaBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: `${colors.primary[400]}88`,
    paddingHorizontal: 6,
    paddingVertical: 3,
    zIndex: 10,
  },
  iaBadgeText: {
    fontSize: 8,
    color: colors.primary[400],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.bold,
  },
  regenBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: colors.neutral[700],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  generateOverlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    marginTop: spacing[4],
    borderRadius: 9999,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },
  generateOverlayBtnText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[950],
    letterSpacing: 1.5,
  },
  heightBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderWidth: 1,
    borderColor: colors.primary[400],
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10,
  },
  heightBadgeText: {
    fontSize: 10,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  morphBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    borderWidth: 1,
    borderColor: colors.neutral[700],
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  morphBadgeText: {
    fontSize: 9,
    color: colors.neutral[400],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.bold,
  },

  // Selfie
  selfieFrame: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 52,
    height: 64,
    borderWidth: 1,
    borderColor: colors.primary[400],
    overflow: 'hidden',
    zIndex: 10,
  },
  selfieImg: { width: '100%', height: '100%' },
  selfieBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'colors.primary[500]',
    paddingVertical: 1,
    alignItems: 'center',
  },
  selfieBadgeText: {
    fontSize: 7,
    color: '#000',
    fontWeight: typography.fontWeight.black,
    letterSpacing: 1,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing[3] },
  statNum: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.primary[400],
  },
  statLabel: { fontSize: 8, color: colors.neutral[500], letterSpacing: 2, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.neutral[800] },

  // Legend
  legendSection: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  legendTitle: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 3,
    marginBottom: spacing[3],
  },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 9, color: colors.neutral[400], letterSpacing: 1 },

  // Empty dressing
  emptyDressingCard: {
    margin: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    borderStyle: 'dashed',
    padding: spacing[5],
    alignItems: 'center',
    gap: spacing[3],
  },
  emptyDressingText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyDressingBtn: {
    borderWidth: 1,
    borderColor: colors.neutral[700],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  emptyDressingBtnText: {
    fontSize: 10,
    color: colors.neutral[300],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.bold,
  },

  // Try-on teaser
  tryonCard: {
    margin: spacing[4],
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: `${colors.primary[400]}44`,
    backgroundColor: 'rgba(0,196,191,0.04)',
    padding: spacing[4],
    gap: spacing[2],
  },
  tryonCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  tryonCardTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: 2,
  },
  comingSoonBadge: {
    borderWidth: 1,
    borderColor: colors.primary[400],
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 8,
    color: colors.primary[400],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.bold,
  },
  tryonCardDesc: { fontSize: typography.fontSize.xs, color: colors.neutral[500], lineHeight: 18 },

  // Photo selfie button (écran ready)
  photoSelfieBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
  },
  photoSelfieBtnText: {
    fontSize: 10,
    color: colors.primary[400],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.bold,
  },

  // Content sections
  sectionEye: { fontSize: 9, color: colors.primary[400], letterSpacing: 3, marginBottom: 4 },
  sectionTitle: {
    fontSize: 11,
    color: colors.neutral[0],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },

  // Body type
  bodyTypeGrid: { gap: spacing[2] },
  bodyTypeCard: {
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    overflow: 'hidden',
  },
  bodyTypeCardActive: { borderColor: colors.primary[400], backgroundColor: 'rgba(0,196,191,0.08)' },
  bodyTypeLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[500],
    letterSpacing: 2,
  },
  bodyTypeLabelActive: { color: colors.primary[400] },
  bodyTypeDesc: { fontSize: 11, color: colors.neutral[600], marginTop: 2 },

  // Height
  heightScroll: { marginVertical: spacing[1] },
  heightScrollContent: { gap: spacing[2] },
  heightChip: {
    width: 56,
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    alignItems: 'center',
    borderRadius: 9999,
  },
  heightChipActive: { borderColor: colors.primary[400], backgroundColor: 'rgba(0,196,191,0.08)' },
  heightChipText: { fontSize: 11, color: colors.neutral[500], letterSpacing: 0.5 },
  heightChipTextActive: { color: colors.primary[400], fontWeight: typography.fontWeight.bold },

  // Swatches
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  swatchBtn: { alignItems: 'center', gap: 5 },
  swatch: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  swatchActive: { borderColor: colors.primary[400], borderWidth: 2, borderRadius: 4 },
  swatchLabel: { fontSize: 9, color: colors.neutral[600], letterSpacing: 0.5 },
  swatchLabelActive: { color: colors.neutral[0] },

  // Hair length
  hairLengthRow: { flexDirection: 'row', gap: spacing[2] },
  hairLengthBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    alignItems: 'center',
    borderRadius: 9999,
  },
  hairLengthBtnActive: {
    borderColor: colors.primary[400],
    backgroundColor: 'rgba(0,196,191,0.08)',
  },
  hairLengthText: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.bold,
  },
  hairLengthTextActive: { color: colors.primary[400] },

  // Photo button (création)
  photoFullBtn: {
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: colors.neutral[900],
    padding: spacing[4],
  },
  photoPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  photoThumb: { width: 48, height: 60, borderWidth: 1, borderColor: colors.primary[400] },
  photoPlaceholder: {
    width: 48,
    height: 60,
    borderWidth: 1,
    borderColor: colors.neutral[700],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFullBtnText: {
    fontSize: 10,
    color: colors.primary[400],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.bold,
  },
  photoHint: { fontSize: 10, color: colors.neutral[600], marginTop: 3 },

  // Next button
  nextBtn: {
    marginTop: spacing[5],
    borderWidth: 1,
    borderColor: colors.neutral[700],
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 9999,
  },
  nextBtnText: {
    fontSize: 11,
    color: colors.neutral[0],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.bold,
  },

  // Save bar
  saveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.neutral[950],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
    padding: spacing[4],
  },
  saveBtn: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: 9999,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[950],
    letterSpacing: 2,
  },
  analysisBanner: {
    backgroundColor: 'rgba(0,196,191,0.08)',
    borderWidth: 1,
    borderColor: colors.primary[600],
    borderRadius: 8,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  analysisBannerText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    letterSpacing: 0.5,
    lineHeight: 18,
  },
});

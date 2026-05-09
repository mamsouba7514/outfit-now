import { colors, typography, spacing } from '@outfit-now/design-tokens';
import type { DressingItem } from '@outfit-now/shared-types';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useDressingStore } from '../../../hooks/useDressing';
import { requestTryOnItem } from '../../../lib/avatar';
import { getDressingItem, updateDressingItem } from '../../../lib/dressing';

const CATEGORY_FR: Record<string, string> = {
  tops: 'Hauts',
  bottoms: 'Bas',
  dresses: 'Robes',
  outerwear: 'Manteaux',
  shoes: 'Chaussures',
  bags: 'Sacs',
  accessories: 'Accessoires',
  swimwear: 'Maillots',
  activewear: 'Sport',
  underwear: 'Sous-vêtements',
};

export default function DressingItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { markWorn, removeItem } = useDressingStore();
  const [item, setItem] = useState<DressingItem | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Resale modal state ─────────────────────────────────────────────────────
  const [saleModalVisible, setSaleModalVisible] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [saleLoading, setSaleLoading] = useState(false);
  const [tryonLoading, setTryonLoading] = useState(false);
  const [tryonUrl, setTryonUrl] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    getDressingItem(id)
      .then(setItem)
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  async function handleTryOn() {
    if (!item) return;
    setTryonLoading(true);
    setTryonUrl(null);
    try {
      const result = await requestTryOnItem(item.id);
      if (result.status === 'completed' && result.resultUrl) {
        setTryonUrl(result.resultUrl);
      } else {
        Alert.alert('Essayage', result.message ?? 'Réessaie dans quelques secondes.');
      }
    } catch (e) {
      const msg =
        (e instanceof Error ? e.message : null) ??
        (e as { message?: string })?.message ??
        JSON.stringify(e);
      Alert.alert('Erreur', msg);
    } finally {
      setTryonLoading(false);
    }
  }

  async function handleWorn() {
    if (!item) return;
    await markWorn(item.id);
    setItem((i) => (i ? { ...i, wornCount: i.wornCount + 1 } : i));
  }

  function handleDelete() {
    if (deleteLoading) return;
    Alert.alert('Supprimer', 'Supprimer cette pièce de ton dressing ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          if (!item) return;
          setDeleteLoading(true);
          try {
            await removeItem(item.id);
            router.back();
          } catch (e) {
            setDeleteLoading(false);
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert('Erreur', msg);
          }
        },
      },
    ]);
  }

  // ── Put on sale ────────────────────────────────────────────────────────────
  function openSaleModal() {
    setPriceInput(item?.askingPrice != null ? String(item.askingPrice) : '');
    setSaleModalVisible(true);
  }

  async function confirmSale() {
    if (!item) return;
    setSaleLoading(true);
    const parsedPrice = priceInput.trim() === '' ? null : parseFloat(priceInput.replace(',', '.'));
    const askingPrice = parsedPrice != null && !isNaN(parsedPrice) ? parsedPrice : null;

    try {
      await updateDressingItem(item.id, { forSale: true, askingPrice });
      setItem((i) => (i ? { ...i, forSale: true, askingPrice } : i));
      setSaleModalVisible(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre en vente. Réessaie.');
    } finally {
      setSaleLoading(false);
    }
  }

  async function removeFromSale() {
    if (!item) return;
    setSaleLoading(true);
    try {
      await updateDressingItem(item.id, { forSale: false, askingPrice: null });
      setItem((i) => (i ? { ...i, forSale: false, askingPrice: null } : i));
    } catch {
      Alert.alert('Erreur', 'Impossible de retirer de la vente. Réessaie.');
    } finally {
      setSaleLoading(false);
    }
  }

  function handleSaleAction() {
    if (item?.forSale) {
      Alert.alert('Retirer de la vente', 'Retirer cette pièce de ta liste de revente ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: removeFromSale },
      ]);
    } else {
      openSaleModal();
    }
  }

  // ── Share listing ──────────────────────────────────────────────────────────
  function buildListingText(): string {
    const cat = CATEGORY_FR[item?.category ?? ''] ?? item?.category ?? '';
    const color = item?.primaryColor ?? '';
    const brand = item?.brand ? ` ${item.brand}` : '';
    const price = item?.askingPrice != null ? `💰 ${item.askingPrice} €` : '💰 Prix à discuter';
    const tags =
      item?.styleTags
        .slice(0, 3)
        .map((t) => `#${t}`)
        .join(' ') ?? '';

    return [
      `🧥 ${cat}${brand} — ${color}`,
      price,
      '',
      tags ? `Style : ${tags}` : '',
      '',
      'Pièce vendue via Outfit Now ✦',
      'outfitnow.app',
    ]
      .filter((l) => l !== undefined)
      .join('\n')
      .trim();
  }

  async function handleShare() {
    if (!item) return;
    const text = buildListingText();
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      // Share image + text
      try {
        await Sharing.shareAsync(item.imageUrl, {
          dialogTitle: 'Partager cette pièce',
          mimeType: 'image/jpeg',
        });
      } catch {
        // Fallback to clipboard
        await Clipboard.setStringAsync(text);
        Alert.alert('Copié ✓', "Le texte de l'annonce a été copié dans le presse-papier.");
      }
    } else {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copié ✓', "Le texte de l'annonce a été copié dans le presse-papier.");
    }
  }

  async function handleCopyListing() {
    if (!item) return;
    const text = buildListingText();
    await Clipboard.setStringAsync(text);
    Alert.alert('Copié ✓', 'Texte prêt à coller sur Vinted ou Leboncoin.');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={colors.primary[400]} />
      </View>
    );
  }

  if (!item) return null;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar barStyle="dark-content" />

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← RETOUR</Text>
        </TouchableOpacity>

        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
          {item.forSale && (
            <View style={styles.forSaleOverlay}>
              <Text style={styles.forSaleOverlayText}>
                {item.askingPrice != null ? `${item.askingPrice} €` : 'EN VENTE'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <View style={styles.topRow}>
            <Text style={styles.categoryLabel}>
              {(CATEGORY_FR[item.category] ?? item.category).toUpperCase()}
            </Text>
            {item.brand && <Text style={styles.brand}>{item.brand}</Text>}
          </View>

          <Text style={styles.color}>{item.primaryColor}</Text>

          {item.styleTags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.styleTags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.wornCount}</Text>
              <Text style={styles.statLabel}>FOIS PORTÉE</Text>
            </View>
            {item.lastWornAt && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {new Date(item.lastWornAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
                <Text style={styles.statLabel}>DERNIÈRE FOIS</Text>
              </View>
            )}
          </View>

          {/* ── Try-on IA ──────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.tryonButton}
            onPress={handleTryOn}
            disabled={tryonLoading}
            activeOpacity={0.85}
          >
            {tryonLoading ? (
              <ActivityIndicator size="small" color={colors.neutral[950]} />
            ) : (
              <Text style={styles.tryonButtonText}>✦ ESSAYER SUR MOI</Text>
            )}
          </TouchableOpacity>

          {tryonUrl && (
            <View style={styles.tryonResult}>
              <Image source={{ uri: tryonUrl }} style={styles.tryonImage} contentFit="cover" />
              <Text style={styles.tryonLabel}>ESSAYAGE IA</Text>
            </View>
          )}

          <TouchableOpacity style={styles.wornButton} onPress={handleWorn} activeOpacity={0.85}>
            <Text style={styles.wornButtonText}>JE LA PORTE AUJOURD'HUI</Text>
          </TouchableOpacity>

          {/* ── Resale button ───────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.saleButton, item.forSale && styles.saleButtonActive]}
            onPress={handleSaleAction}
            activeOpacity={0.85}
            disabled={saleLoading}
          >
            {saleLoading ? (
              <ActivityIndicator
                size="small"
                color={item.forSale ? colors.primary[400] : colors.neutral[400]}
              />
            ) : (
              <Text style={[styles.saleButtonText, item.forSale && styles.saleButtonTextActive]}>
                {item.forSale
                  ? `EN VENTE ${item.askingPrice != null ? `· ${item.askingPrice} €` : ''}  ✕ RETIRER`
                  : '◎  METTRE EN VENTE'}
              </Text>
            )}
          </TouchableOpacity>

          {/* ── Share buttons (visible when for sale) ───────────────────── */}
          {item.forSale && (
            <View style={styles.shareRow}>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
                <Text style={styles.shareBtnText}>↗ PARTAGER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleCopyListing}
                activeOpacity={0.85}
              >
                <Text style={styles.shareBtnText}>⎘ COPIER L'ANNONCE</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.deleteButton, deleteLoading && { opacity: 0.5 }]}
            onPress={handleDelete}
            activeOpacity={0.85}
            disabled={deleteLoading}
          >
            <Text style={styles.deleteButtonText}>
              {deleteLoading ? 'Suppression…' : 'Supprimer du dressing'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Price modal ─────────────────────────────────────────────────────── */}
      <Modal
        visible={saleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSaleModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalEyebrow}>REVENTE</Text>
            <Text style={styles.modalTitle}>Quel est ton prix ?</Text>
            <Text style={styles.modalSub}>Laisse vide si tu préfères ne pas afficher de prix.</Text>

            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                value={priceInput}
                onChangeText={setPriceInput}
                placeholder="0"
                placeholderTextColor={colors.neutral[700]}
                keyboardType="decimal-pad"
                maxLength={6}
                autoFocus
              />
              <Text style={styles.priceCurrency}>EUR</Text>
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={confirmSale}
              activeOpacity={0.85}
              disabled={saleLoading}
            >
              {saleLoading ? (
                <ActivityIndicator size="small" color={colors.neutral[950]} />
              ) : (
                <Text style={styles.confirmBtnText}>METTRE EN VENTE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setSaleModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  content: { paddingBottom: spacing[12] },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[950],
  },
  backButton: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[4],
  },
  backText: {
    color: colors.primary[400],
    fontSize: typography.fontSize.xs,
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },
  imageWrapper: { position: 'relative' },
  image: { width: '100%', height: 440 },
  forSaleOverlay: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  forSaleOverlayText: {
    fontSize: 10,
    color: colors.neutral[950],
    fontWeight: typography.fontWeight.black,
    letterSpacing: 1,
  },
  details: { padding: spacing[6], gap: spacing[4] },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
  },
  brand: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  color: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
    textTransform: 'capitalize',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  tag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  tagText: {
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.medium,
  },
  divider: { height: 1, backgroundColor: colors.neutral[900] },
  statsRow: { flexDirection: 'row', gap: spacing[8] },
  stat: { gap: 4 },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
  },
  statLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  tryonButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },
  tryonButtonText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 2,
  },
  tryonResult: {
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.primary[400],
  },
  tryonImage: { width: '100%', height: 420 },
  tryonLabel: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
    fontSize: 9,
    color: colors.primary[400],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  wornButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  wornButtonText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 2,
  },

  // ── Sale button ────────────────────────────────────────────────────────────
  saleButton: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  saleButtonActive: {
    borderColor: colors.primary[600],
    backgroundColor: '#1A0F00',
  },
  saleButtonText: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 2,
  },
  saleButtonTextActive: {
    color: colors.primary[400],
  },

  shareRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  shareBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  shareBtnText: {
    fontSize: 10,
    color: colors.neutral[400],
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.black,
  },
  deleteButton: {
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D1010',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    letterSpacing: 1,
    fontWeight: typography.fontWeight.medium,
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalSheet: {
    backgroundColor: colors.neutral[950],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
    padding: spacing[6],
    paddingBottom: spacing[12],
    gap: spacing[4],
  },
  modalHandle: {
    width: 36,
    height: 3,
    backgroundColor: colors.neutral[800],
    alignSelf: 'center',
    marginBottom: spacing[2],
  },
  modalEyebrow: {
    fontSize: 9,
    color: colors.primary[500],
    letterSpacing: 3,
    fontWeight: typography.fontWeight.black,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
  },
  modalSub: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    marginTop: -spacing[2],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[800],
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    marginTop: spacing[2],
  },
  priceInput: {
    flex: 1,
    paddingVertical: spacing[4],
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: -0.5,
  },
  priceCurrency: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  confirmBtn: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  confirmBtnText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 2,
  },
  cancelBtn: {
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    letterSpacing: 1,
  },
});

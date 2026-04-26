import { colors, typography, spacing } from '@outfit-now/design-tokens';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

import { track } from '../../lib/analytics';
import { getUploadUrl, uploadToS3, createDressingItem, getScanStatus } from '../../lib/dressing';

type Step = 'camera' | 'preview' | 'uploading' | 'scanning';

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>('camera');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  async function takePhoto() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
    if (!photo) return;
    setPhotoUri(photo.uri);
    const res = await fetch(photo.uri);
    setPhotoBlob(await res.blob());
    setStep('preview');
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    const res = await fetch(uri);
    setPhotoBlob(await res.blob());
    setStep('preview');
  }

  async function confirmScan() {
    if (!photoBlob || !photoUri) return;
    setStep('uploading');
    track.scanStarted();

    try {
      const contentType = 'image/jpeg';
      const { uploadUrl, imageKey } = await getUploadUrl(contentType);
      await uploadToS3(uploadUrl, photoBlob, contentType);

      setStep('scanning');
      const { id } = await createDressingItem(imageKey);

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const status = await getScanStatus(id);
          if (status.scanStatus === 'completed') {
            clearInterval(poll);
            track.scanCompleted({ category: status.category ?? 'unknown' });
            router.replace(`/(app)/scan-validation?id=${id}` as never);
          } else if (status.scanStatus === 'failed' || attempts > 30) {
            clearInterval(poll);
            Alert.alert('Scan échoué', 'Réessaie avec une autre photo.');
            setStep('camera');
          }
        } catch {
          clearInterval(poll);
          setStep('camera');
        }
      }, 2000);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Réessaie.');
      setStep('camera');
    }
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.permissionEyebrow}>ACCÈS REQUIS</Text>
        <Text style={styles.permissionText}>
          Autorise l'accès à la caméra pour scanner tes pièces.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>AUTORISER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'preview' && photoUri) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setStep('camera')}>
            <Text style={styles.cancelText}>REPRENDRE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={confirmScan}>
            <Text style={styles.confirmText}>ANALYSER</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'uploading' || step === 'scanning') {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={colors.primary[400]} />
        <Text style={styles.loadingTitle}>
          {step === 'uploading' ? 'ENVOI EN COURS' : 'ANALYSE IA'}
        </Text>
        <Text style={styles.loadingText}>
          {step === 'scanning'
            ? 'Identification de la pièce, couleurs et style…'
            : 'Téléchargement de la photo…'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.frameWrapper}>
            <View style={styles.frame}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.hint}>Centre la pièce dans le cadre</Text>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickFromLibrary}>
              <Text style={styles.galleryText}>GALERIE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureRing}>
                <View style={styles.captureInner} />
              </View>
            </TouchableOpacity>

            <View style={{ width: 60 }} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[10],
  },
  closeButton: { alignSelf: 'flex-start', padding: spacing[2] },
  closeText: { color: '#FFFFFF', fontSize: typography.fontSize.xl },
  frameWrapper: {
    alignItems: 'center',
    gap: spacing[4],
  },
  frame: {
    width: 260,
    height: 340,
    borderWidth: 0,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary[400],
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    letterSpacing: 1.5,
    fontWeight: typography.fontWeight.medium,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  galleryButton: { width: 60, alignItems: 'center' },
  galleryText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },
  captureButton: { alignItems: 'center', justifyContent: 'center' },
  captureRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  preview: { flex: 1 },
  previewActions: {
    flexDirection: 'row',
    padding: spacing[6],
    gap: spacing[4],
    backgroundColor: colors.neutral[950],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[700],
    alignItems: 'center',
  },
  cancelText: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.xs,
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing[4],
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  confirmText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    letterSpacing: 2,
    fontWeight: typography.fontWeight.black,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.neutral[950],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  loadingTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: 4,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[5],
    backgroundColor: colors.neutral[950],
  },
  permissionEyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    letterSpacing: 4,
    fontWeight: typography.fontWeight.black,
  },
  permissionText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 26,
  },
  permissionBtn: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[10],
  },
  permissionBtnText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
});

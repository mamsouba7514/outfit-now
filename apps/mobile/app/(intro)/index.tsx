import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@outfit-now/design-tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function go(target: '/(auth)/signup' | '/(auth)/login') {
    await AsyncStorage.setItem('intro_seen', 'true');
    router.replace(target);
  }

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Logo */}
      <View style={styles.logoSection}>
        <View style={styles.logoIconWrap}>
          <View style={styles.logoIconCircle}>
            <Ionicons name="shirt-outline" size={40} color={colors.primary[500]} />
          </View>
        </View>
        <Text style={styles.logoTitle}>OUTFIT{'\n'}NOW</Text>
        <Text style={styles.logoTagline}>Ton style, maintenant.</Text>
      </View>

      {/* CTAs */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={[styles.primaryBtnWrap, styles.primaryBtn]}
          onPress={() => go('/(auth)/signup')}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>Créer mon compte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => go('/(auth)/login')}
          activeOpacity={0.88}
        >
          <Text style={styles.secondaryBtnText}>Se connecter</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Continuer avec</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
            <Text style={styles.socialBtnText}>G</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
            <Ionicons name="logo-apple" size={20} color="#0D1B2A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => go('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={20} color="#0D1B2A" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing[6],
    justifyContent: 'space-between',
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  logoIconWrap: { marginBottom: spacing[2] },
  logoIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 40,
    color: '#0D1B2A',
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: 4,
  },
  logoTagline: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#A0AEC0',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  ctaSection: {
    gap: spacing[3],
  },
  primaryBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#00C4BF',
  },
  primaryBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#0D1B2A',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginVertical: spacing[1],
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#A0AEC0',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  socialBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#0D1B2A',
  },
});

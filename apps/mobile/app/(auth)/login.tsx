import { colors, typography, spacing } from '@outfit-now/design-tokens';
import { Link } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';

import { useAuthStore } from '../../hooks/useAuth';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeField, setActiveField] = useState<'email' | 'password' | null>(null);

  // Entrance animation
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;

  // Error banner animation
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const errorTranslateY = useRef(new Animated.Value(-8)).current;

  // Button scale
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(logoTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (error) {
      Animated.parallel([
        Animated.timing(errorOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(errorTranslateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      errorOpacity.setValue(0);
      errorTranslateY.setValue(-8);
    }
  }, [error]);

  function onButtonPressIn() {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  }
  function onButtonPressOut() {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  }

  async function handleLogin() {
    if (!email || !password) {
      setError('Remplis tous les champs.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion échouée. Réessaie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.inner}>

        {/* Logo block with entrance animation */}
        <Animated.View style={[styles.logoBlock, { opacity: logoOpacity, transform: [{ translateY: logoTranslateY }] }]}>
          <Text style={styles.logoEyebrow}>FASHION AI</Text>
          <Text style={styles.logoTitle}>OUTFIT{'\n'}NOW</Text>
          <View style={styles.logoDivider} />
          <Text style={styles.logoSub}>Ton styliste personnel</Text>
        </Animated.View>

        {/* Inline error banner */}
        {error ? (
          <Animated.View style={[styles.errorBanner, { opacity: errorOpacity, transform: [{ translateY: errorTranslateY }] }]}>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, activeField === 'email' && styles.fieldLabelActive]}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="adresse@email.com"
              placeholderTextColor={colors.neutral[700]}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardAppearance="light"
              onFocus={() => setActiveField('email')}
              onBlur={() => setActiveField(null)}
            />
            <View style={[styles.inputLine, activeField === 'email' && styles.inputLineActive]} />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, activeField === 'password' && styles.fieldLabelActive]}>MOT DE PASSE</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.neutral[700]}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              secureTextEntry
              keyboardAppearance="light"
              onFocus={() => setActiveField('password')}
              onBlur={() => setActiveField(null)}
            />
            <View style={[styles.inputLine, activeField === 'password' && styles.inputLineActive]} />
            <TouchableOpacity style={styles.forgotBtn} hitSlop={8}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            onPressIn={onButtonPressIn}
            onPressOut={onButtonPressOut}
            disabled={loading}
            activeOpacity={1}
          >
            {loading ? (
              <ActivityIndicator color={colors.neutral[950]} />
            ) : (
              <Text style={styles.buttonText}>SE CONNECTER</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Pas encore de compte — </Text>
            <Text style={styles.linkAccent}>S'inscrire</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[950],
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    gap: spacing[8],
  },
  logoBlock: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  logoEyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    letterSpacing: 4,
    fontWeight: typography.fontWeight.black,
  },
  logoTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
    lineHeight: 52,
    letterSpacing: -1,
  },
  logoDivider: {
    width: 48,
    height: 2,
    backgroundColor: '#E8194A',
    marginVertical: spacing[3],
  },
  logoSub: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    letterSpacing: 1,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: -spacing[4],
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    letterSpacing: 0.5,
  },
  form: {
    gap: spacing[6],
  },
  fieldBlock: {
    gap: spacing[2],
  },
  fieldLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  fieldLabelActive: {
    color: colors.primary[400],
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
  inputLineActive: {
    backgroundColor: colors.primary[400],
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing[1],
  },
  forgotText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
    borderRadius: 9999,
    shadowColor: '#2448D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.neutral[950],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  linkText: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  linkAccent: {
    color: colors.primary[400],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});

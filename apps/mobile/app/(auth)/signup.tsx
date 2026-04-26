import { colors, typography, spacing } from '@outfit-now/design-tokens';
import { Link } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  View,
  StatusBar,
  Animated,
} from 'react-native';

import { useAuthStore } from '../../hooks/useAuth';

const FIELDS = [
  { key: 'firstName' as const, label: 'PRÉNOM', placeholder: 'Jean', secure: false, keyboard: 'default' as const },
  { key: 'lastName' as const, label: 'NOM', placeholder: 'Dupont', secure: false, keyboard: 'default' as const },
  { key: 'email' as const, label: 'EMAIL', placeholder: 'jean@email.com', secure: false, keyboard: 'email-address' as const },
  { key: 'password' as const, label: 'MOT DE PASSE', placeholder: '8 caractères minimum', secure: true, keyboard: 'default' as const },
];

export default function SignupScreen() {
  const { signup } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(20)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const errorTranslateY = useRef(new Animated.Value(-8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
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

  function update(key: keyof typeof form) {
    return (val: string) => {
      setForm((f) => ({ ...f, [key]: val }));
      setError('');
    };
  }

  function onButtonPressIn() {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  }
  function onButtonPressOut() {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  }

  async function handleSignup() {
    const { firstName, lastName, email, password } = form;
    if (!firstName || !lastName || !email || !password) {
      setError('Remplis tous les champs.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signup({ firstName, lastName, email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription échouée. Réessaie.');
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
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.headerBlock, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
          <Text style={styles.eyebrow}>CRÉER UN COMPTE</Text>
          <Text style={styles.title}>Rejoins{'\n'}Outfit Now</Text>
          <View style={styles.divider} />
        </Animated.View>

        {error ? (
          <Animated.View style={[styles.errorBanner, { opacity: errorOpacity, transform: [{ translateY: errorTranslateY }] }]}>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : null}

        <View style={styles.form}>
          {FIELDS.map((field) => (
            <View key={field.key} style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, activeField === field.key && styles.fieldLabelActive]}>
                {field.label}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor={colors.neutral[700]}
                value={form[field.key]}
                onChangeText={update(field.key)}
                keyboardType={field.keyboard}
                autoCapitalize={field.key === 'email' || field.key === 'password' ? 'none' : 'words'}
                secureTextEntry={field.secure}
                autoCorrect={false}
                keyboardAppearance="light"
                onFocus={() => setActiveField(field.key)}
                onBlur={() => setActiveField(null)}
              />
              <View style={[styles.inputLine, activeField === field.key && styles.inputLineActive]} />
            </View>
          ))}
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            onPressIn={onButtonPressIn}
            onPressOut={onButtonPressOut}
            disabled={loading}
            activeOpacity={1}
          >
            {loading ? (
              <ActivityIndicator color={colors.neutral[950]} />
            ) : (
              <Text style={styles.buttonText}>S'INSCRIRE</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Déjà un compte — </Text>
            <Text style={styles.linkAccent}>Se connecter</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[16],
    gap: spacing[8],
  },
  headerBlock: { gap: spacing[3] },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    letterSpacing: 4,
    fontWeight: typography.fontWeight.black,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
    lineHeight: 40,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: '#E8194A',
    marginTop: spacing[2],
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
  form: { gap: spacing[5] },
  fieldBlock: { gap: spacing[2] },
  fieldLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  fieldLabelActive: { color: colors.primary[400] },
  input: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[0],
    paddingVertical: spacing[2],
    backgroundColor: 'transparent',
  },
  inputLine: { height: 1, backgroundColor: colors.neutral[800] },
  inputLineActive: { backgroundColor: colors.primary[400] },
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 9999,
    shadowColor: '#2448D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
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
  linkText: { color: colors.neutral[500], fontSize: typography.fontSize.sm },
  linkAccent: {
    color: colors.primary[400],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});

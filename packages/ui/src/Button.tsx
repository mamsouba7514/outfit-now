import { colors, typography, spacing } from '@outfit-now/design-tokens';
import { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.base, styles[variant], styles[size], (disabled || loading) && styles.disabled, style]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.neutral[950] : colors.primary[400]} />
        ) : (
          <Text style={[styles.label, styles[`label_${variant}`], styles[`label_${size}`]]}>
            {label.toUpperCase()}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  primary: {
    backgroundColor: colors.primary[600],
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  sm: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  md: { paddingVertical: spacing[3], paddingHorizontal: spacing[6] },
  lg: { paddingVertical: spacing[4], paddingHorizontal: spacing[8] },
  disabled: { opacity: 0.4 },
  label: {
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
  label_primary: { color: colors.neutral[950] },
  label_secondary: { color: colors.neutral[400] },
  label_ghost: { color: colors.primary[400] },
  label_sm: { fontSize: typography.fontSize.xs },
  label_md: { fontSize: typography.fontSize.sm },
  label_lg: { fontSize: typography.fontSize.base },
});

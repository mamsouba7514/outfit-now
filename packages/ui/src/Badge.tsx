import { colors, typography } from '@outfit-now/design-tokens';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

type Variant = 'gold' | 'neutral' | 'success' | 'error';
type Size = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'gold', size = 'md', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  gold: { borderColor: colors.primary[400], backgroundColor: 'transparent' },
  neutral: { borderColor: colors.neutral[600], backgroundColor: 'transparent' },
  success: { borderColor: colors.success, backgroundColor: 'transparent' },
  error: { borderColor: colors.error, backgroundColor: 'transparent' },
  sm: { paddingHorizontal: 5, paddingVertical: 2 },
  md: { paddingHorizontal: 7, paddingVertical: 3 },
  text: {
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1.5,
  },
  text_gold: { color: colors.primary[400] },
  text_neutral: { color: colors.neutral[400] },
  text_success: { color: colors.success },
  text_error: { color: colors.error },
  text_sm: { fontSize: 9 },
  text_md: { fontSize: 11 },
});

import { colors } from '@outfit-now/design-tokens';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type Variant = 'gold' | 'neutral';

interface DividerProps {
  variant?: Variant;
  width?: number | '100%';
  style?: ViewStyle;
}

export function Divider({ variant = 'gold', width = 40, style }: DividerProps) {
  return <View style={[styles.base, styles[variant], { width }, style]} />;
}

const styles = StyleSheet.create({
  base: { height: 1 },
  gold: { backgroundColor: colors.primary[600] },
  neutral: { backgroundColor: colors.neutral[800], width: '100%' },
});

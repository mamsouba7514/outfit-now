import { colors, shadows, spacing } from '@outfit-now/design-tokens';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

type Variant = 'default' | 'elevated' | 'bordered';

interface CardProps {
  children: React.ReactNode;
  variant?: Variant;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', onPress, style }: CardProps) {
  const cardStyle = [styles.base, styles[variant], style];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    padding: spacing[4],
    borderRadius: 16,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: colors.neutral[900],
  },
  elevated: {
    backgroundColor: colors.neutral[900],
    ...shadows.md,
  },
  bordered: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
});

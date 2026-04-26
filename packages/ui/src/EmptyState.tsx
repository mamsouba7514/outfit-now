import { colors, typography, spacing } from '@outfit-now/design-tokens';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export function EmptyState({ icon, title, subtitle, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.wrap, style]}>
      {icon && <Ionicons name={icon} size={40} color={colors.neutral[700]} style={styles.icon} />}
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity style={styles.btn} onPress={action.onPress} activeOpacity={0.85}>
          <Text style={styles.btnText}>{action.label.toUpperCase()}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    gap: spacing[3],
  },
  icon: { marginBottom: spacing[2] },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    color: colors.neutral[0],
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  btn: {
    marginTop: spacing[3],
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
  },
  btnText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[950],
    letterSpacing: 2,
  },
});

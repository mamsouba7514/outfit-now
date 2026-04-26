import { colors, typography, spacing } from '@outfit-now/design-tokens';
import { StyleSheet, Text, TouchableOpacity, type ViewStyle } from 'react-native';

interface TagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Tag({ label, selected = false, onPress, style }: TagProps) {
  return (
    <TouchableOpacity
      style={[styles.tag, selected ? styles.selected : styles.unselected, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>
        {label.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
  },
  selected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  unselected: {
    backgroundColor: 'transparent',
    borderColor: colors.neutral[700],
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 2,
  },
  textSelected: { color: colors.neutral[950] },
  textUnselected: { color: colors.neutral[500] },
});

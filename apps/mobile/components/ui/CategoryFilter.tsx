import { colors, typography, spacing } from '@outfit-now/design-tokens';
import type { ClothingCategory } from '@outfit-now/shared-types';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

const CATEGORIES: { label: string; value: ClothingCategory }[] = [
  { label: 'Hauts', value: 'tops' },
  { label: 'Bas', value: 'bottoms' },
  { label: 'Robes', value: 'dresses' },
  { label: 'Manteaux', value: 'outerwear' },
  { label: 'Chaussures', value: 'shoes' },
  { label: 'Accessoires', value: 'accessories' },
  { label: 'Sacs', value: 'bags' },
  { label: 'Sport', value: 'activewear' },
];

interface Props {
  selected: ClothingCategory | null;
  onSelect: (cat: ClothingCategory | null) => void;
}

export function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        style={[styles.chip, selected === null && styles.chipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.chipText, selected === null && styles.chipTextActive]}>TOUT</Text>
      </TouchableOpacity>

      {CATEGORIES.map(({ label, value }) => (
        <TouchableOpacity
          key={value}
          style={[styles.chip, selected === value && styles.chipActive]}
          onPress={() => onSelect(selected === value ? null : value)}
        >
          <Text style={[styles.chipText, selected === value && styles.chipTextActive]}>
            {label.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    gap: spacing[2],
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[800],
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 1,
  },
  chipTextActive: {
    color: colors.neutral[950],
  },
});

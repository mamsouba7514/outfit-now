import { colors, typography } from '@outfit-now/design-tokens';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native';

interface ScoreBarProps {
  score: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

export function ScoreBar({ score, showLabel = false, style }: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? colors.primary[400] : pct >= 60 ? colors.neutral[500] : colors.neutral[700];
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const animatedWidth = width.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={style}>
      {showLabel && (
        <Text style={[styles.label, { color }]}>{pct}</Text>
      )}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: animatedWidth, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 2, backgroundColor: colors.neutral[800], marginTop: 6 },
  fill: { height: 2 },
  label: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
});

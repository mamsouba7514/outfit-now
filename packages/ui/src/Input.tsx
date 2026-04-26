import { colors, typography, spacing } from '@outfit-now/design-tokens';
import { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  style?: ViewStyle;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const lineColor = useRef(new Animated.Value(0)).current;

  function onFocus() {
    setFocused(true);
    Animated.timing(lineColor, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    props.onFocus?.({} as never);
  }

  function onBlur() {
    setFocused(false);
    Animated.timing(lineColor, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    props.onBlur?.({} as never);
  }

  const animatedBorderColor = lineColor.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral[800], colors.primary[400]],
  });

  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.neutral[700]}
        keyboardAppearance="dark"
        {...props}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <Animated.View style={[styles.line, { backgroundColor: animatedBorderColor }]} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[2] },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  labelFocused: { color: colors.primary[400] },
  input: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[0],
    paddingVertical: spacing[2],
    backgroundColor: 'transparent',
  },
  line: { height: 1 },
  error: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing[1],
  },
});

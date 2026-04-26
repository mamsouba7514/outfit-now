import { colors, typography, spacing } from '@outfit-now/design-tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    label: '01',
    title: 'Ton dressing,\nenfin organisé.',
    subtitle: "Scanne tes pièces en quelques secondes. L'IA catégorise, détecte les couleurs et les styles automatiquement.",
    accent: 'SCAN',
  },
  {
    label: '02',
    title: 'Un styliste IA\ndans ta poche.',
    subtitle: 'Décris ton occasion — réunion, soirée, week-end — et reçois 3 tenues composées depuis ton propre dressing.',
    accent: 'COMPOSE',
  },
  {
    label: '03',
    title: 'Porte mieux.\nAchète moins.',
    subtitle: "Découvre les pièces que tu n'utilises jamais. Réduis les achats impulsifs et redonne vie à ce que tu possèdes déjà.",
    accent: 'STYLE',
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const dotWidths = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 32 : 16))).current;

  useEffect(() => {
    // Animate content fade+slide on slide change
    Animated.parallel([
      Animated.sequence([
        Animated.timing(contentOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(contentTranslateY, { toValue: 12, duration: 120, useNativeDriver: true }),
        Animated.timing(contentTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    // Animate dots
    dotWidths.forEach((w, i) => {
      Animated.timing(w, {
        toValue: i === activeIndex ? 32 : 16,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
  }, [activeIndex]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== activeIndex) setActiveIndex(idx);
  }

  function goNext() {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      void finish();
    }
  }

  function onButtonPressIn() {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  }
  function onButtonPressOut() {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  }

  async function finish() {
    await AsyncStorage.setItem('intro_seen', 'true');
    router.replace('/(auth)/login');
  }

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity style={styles.skip} onPress={finish}>
        <Text style={styles.skipText}>PASSER</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={styles.slide}>
            <Animated.View style={{ opacity: i === activeIndex ? contentOpacity : 1, transform: [{ translateY: i === activeIndex ? contentTranslateY : 0 }] }}>
              <Text style={styles.accentLabel}>{s.accent}</Text>
              <View style={styles.divider} />
              <Text style={styles.slideNumber}>{s.label}</Text>
              <Text style={styles.slideTitle}>{s.title}</Text>
              <Text style={styles.slideSubtitle}>{s.subtitle}</Text>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Gradient overlay fading into background at bottom */}
      <LinearGradient
        colors={['transparent', colors.neutral[950]]}
        style={styles.gradient}
        pointerEvents="none"
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidths[i] }, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={goNext}
            onPressIn={onButtonPressIn}
            onPressOut={onButtonPressOut}
            activeOpacity={1}
          >
            <Text style={styles.nextBtnText}>
              {isLast ? 'COMMENCER' : 'SUIVANT'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[950],
  },
  skip: {
    position: 'absolute',
    top: spacing[16],
    right: spacing[6],
    zIndex: 10,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  skipText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: spacing[8],
    paddingTop: spacing[16] + spacing[16],
    gap: spacing[5],
  },
  accentLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    letterSpacing: 4,
    fontWeight: typography.fontWeight.black,
  },
  divider: {
    width: 32,
    height: 1,
    backgroundColor: colors.primary[600],
    marginVertical: spacing[1],
  },
  slideNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[700],
    letterSpacing: 2,
    fontWeight: typography.fontWeight.medium,
  },
  slideTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
    lineHeight: 50,
    marginTop: spacing[2],
  },
  slideSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    lineHeight: 26,
    maxWidth: 320,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  footer: {
    paddingHorizontal: spacing[8],
    paddingBottom: spacing[12],
    gap: spacing[6],
    zIndex: 2,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  dot: {
    height: 2,
    backgroundColor: colors.neutral[700],
  },
  dotActive: {
    backgroundColor: colors.primary[400],
  },
  nextBtn: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderRadius: 9999,
  },
  nextBtnText: {
    color: colors.neutral[0],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    letterSpacing: 3,
  },
});

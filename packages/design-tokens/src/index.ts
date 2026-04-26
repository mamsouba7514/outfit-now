// ─── Couture Tricolore — Design Tokens ───────────────────────────────────────
//
// Blanc pur · Bleu cobalt électrique · Rose-rouge vif
// Inspiré : Valentino × Chanel × Courreges
//
// 3 couleurs tranchées, mode clair, impact maximal.

export const colors = {
  // Bleu cobalt — accent principal, force éditoriale
  primary: {
    50:  '#EEF2FF',
    100: '#D4DCFF',
    200: '#A8BAFF',
    300: '#7292FF',
    400: '#4066F0', // Bleu cobalt — icônes actives, labels
    500: '#2448D8', // Bleu électrique — CTA principal ★
    600: '#1432B8', // Bleu profond — pressed
    700: '#0E2490',
    800: '#081868',
    900: '#040E40',
  },
  // Rose-rouge — accent secondaire, chaleur et énergie
  rose: {
    50:  '#FFF0F4',
    100: '#FFD4E0',
    200: '#FFB0C4',
    300: '#FF7AA0',
    400: '#F04070', // Rose-rouge clair — highlights
    500: '#E8194A', // Rose-rouge vif — accents chauds ★
    600: '#C40F38', // Rouge profond — emphase
    700: '#9E0828',
    800: '#780418',
    900: '#50020E',
  },
  // Neutral — INVERSÉ : 950 = blanc, 0 = bleu-noir (mode clair)
  neutral: {
    0:    '#080F2A', // Texte principal (bleu-noir profond)
    50:   '#0F1840',
    100:  '#1A2860',
    200:  '#263C88',
    300:  '#3852A8',
    400:  '#5270C0', // Icônes inactives, texte tertiaire
    500:  '#7090CC', // Texte secondaire, placeholders
    600:  '#A0B4E0',
    700:  '#C4D0EE', // Bordures légères
    800:  '#DCE4F6', // Bordures cards
    900:  '#EEF0FA', // Surface cards
    950:  '#FFFFFF', // Background principal ★ (blanc pur)
    1000: '#FFFFFF',
  },
  // Sémantiques
  success: '#1A8A4C',
  warning: '#D48A0A',
  error:   '#E8194A',
  info:    '#2448D8',
} as const;

export const typography = {
  fontFamily: {
    sans:    'Inter',
    display: 'Playfair Display',
  },
  fontSize: {
    xs:    11,
    sm:    13,
    base:  15,
    lg:    17,
    xl:    20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 38,
    '5xl': 48,
    '6xl': 60,
  },
  fontWeight: {
    thin:     '100',
    light:    '300',
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    black:    '900',
  },
  lineHeight: {
    tight:   1.1,
    snug:    1.3,
    normal:  1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tightest: -1,
    tight:    -0.5,
    normal:   0,
    wide:     1.5,
    wider:    3,
    widest:   5,
  },
} as const;

export const spacing = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const borderRadius = {
  none: 0,
  sm:   4,
  md:   8,
  lg:   14,
  xl:   20,
  '2xl': 28,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#080F2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#080F2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: '#080F2A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  // Lueur bleue — CTAs principaux
  blue: {
    shadowColor: '#2448D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 7,
  },
  // Lueur rose — accents chauds
  rose: {
    shadowColor: '#E8194A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

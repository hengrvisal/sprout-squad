import { useColorScheme } from 'react-native';

type G = readonly [string, string, string];

/**
 * Design tokens. Soft look: gradient backgrounds per page, frosted cards with a gentle
 * shadow, hairline edges. `outline` is the ink used only inside illustrations (the plant).
 */
const light = {
  ground: '#F1F3EC',
  screen: '#F4F5EF',
  card: '#FFFFFD',
  /** Frosted card on top of a gradient. */
  glass: 'rgba(255,255,252,0.7)',
  glassStrong: 'rgba(255,255,252,0.9)',
  shadow: '#2E3A2F',
  ink: '#1F2A24',
  ink2: '#55615A',
  ink3: '#8E978F',
  /** Hairline edges and dividers. */
  line: 'rgba(31,42,36,0.08)',
  outline: '#1F2A24',
  soft: 'rgba(31,42,36,0.06)',
  tang: '#D9825F',
  tangInk: '#1F2A24',
  lilac: '#B8AED6',
  sky: '#8FB8C4',
  onGreen: '#FFFFFF',
  accent: '#4E9A5E',
  grid: ['rgba(31,42,36,0.07)', '#D3E8C4', '#A6D08E', '#6DAF62', '#3F8746'] as readonly [string, string, string, string, string],
  gridText: ['#8E978F', '#4A5E40', '#2C4424', '#FFFFFF', '#FFFFFF'] as readonly [string, string, string, string, string],
  // quiet, nature-toned washes: morning mist, meadow, sand, sky
  gradients: {
    today: ['#F3F6EE', '#EEF4EA', '#F5F4EC'] as G,
    month: ['#F1F5EC', '#ECF3E7', '#F4F5EE'] as G,
    focus: ['#F7F2EA', '#F4EFE7', '#F1F3EB'] as G,
    rest: ['#EEF4F3', '#EBF2F0', '#F1F4EE'] as G,
    squad: ['#ECF3F5', '#EEF4EC', '#F3F5EA'] as G,
    me: ['#F3F4EF', '#EFF3EC', '#F5F5F0'] as G,
    detail: ['#F4F5F0', '#F1F4EE', '#F6F6F1'] as G,
  },
};

const dark: typeof light = {
  ground: '#0E1411',
  screen: '#0F1512',
  card: '#1A221D',
  glass: 'rgba(255,255,255,0.06)',
  glassStrong: 'rgba(255,255,255,0.1)',
  shadow: '#000000',
  ink: '#EEF2EC',
  ink2: '#B3BDB5',
  ink3: '#7E8A81',
  line: 'rgba(255,255,255,0.08)',
  outline: '#0A0F0C',
  soft: 'rgba(255,255,255,0.07)',
  tang: '#E0936F',
  tangInk: '#1F2A24',
  lilac: '#9A90BE',
  sky: '#6F9AA8',
  onGreen: '#FFFFFF',
  accent: '#5DAF6C',
  grid: ['rgba(255,255,255,0.07)', '#264330', '#35683F', '#4E9A5E', '#8CCB84'] as readonly [string, string, string, string, string],
  gridText: ['#7E8A81', '#B3BDB5', '#E6F4E2', '#FFFFFF', '#10200F'] as readonly [string, string, string, string, string],
  gradients: {
    today: ['#101713', '#111A15', '#131915'] as G,
    month: ['#0F1813', '#111A14', '#121814'] as G,
    focus: ['#1A1612', '#161714', '#121714'] as G,
    rest: ['#0F1718', '#101916', '#121814'] as G,
    squad: ['#0F1719', '#101A15', '#121A12'] as G,
    me: ['#131614', '#111713', '#0F1512'] as G,
    detail: ['#121714', '#111613', '#0F1512'] as G,
  },
};

export type Colors = typeof light;
export type GradientName = keyof Colors['gradients'];

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
  mono: 'JetBrainsMono_700Bold',
} as const;

export const radius = { sm: 12, md: 16, lg: 24, pill: 999 } as const;
export const border = 1;
/** Kept for older call sites; the soft look has no offset shadows. */
export const shadowOffset = 0;

/** A soft, diffuse shadow (iOS/web) with a small elevation on Android. */
export function softShadow(c: Colors, strength = 1) {
  return {
    shadowColor: c.shadow,
    shadowOpacity: 0.08 * strength,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  } as const;
}

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

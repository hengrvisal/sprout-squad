import { useColorScheme } from 'react-native';

/** Design tokens lifted from the Sprout Squad web prototype. */
const light = {
  ground: '#DCE8FF',
  screen: '#F5F8FF',
  card: '#FFFFFF',
  ink: '#131B33',
  ink2: '#4A5575',
  ink3: '#8590AE',
  line: '#131B33',
  soft: '#E6ECFA',
  tang: '#FF7A1A',
  tangInk: '#131B33',
  lilac: '#B9A6FF',
  sky: '#7CC4FF',
  onGreen: '#07210F',
  grid: ['#E3E9F5', '#C5F0B4', '#86DB6E', '#3DBB57', '#157F3B'] as readonly [string, string, string, string, string],
  gridText: ['#8590AE', '#4A5575', '#1D3A1A', '#07210F', '#FFFFFF'] as readonly [string, string, string, string, string],
};

const dark: typeof light = {
  ground: '#0B1022',
  screen: '#131A33',
  card: '#1C2546',
  ink: '#F1F4FF',
  ink2: '#B7C0DE',
  ink3: '#7C87AA',
  line: '#050814',
  soft: '#253058',
  tang: '#FF8A33',
  tangInk: '#131B33',
  lilac: '#9C86FF',
  sky: '#4FA6E8',
  onGreen: '#07210F',
  grid: ['#253058', '#1E5A36', '#23883F', '#3DBB57', '#8DF08A'] as readonly [string, string, string, string, string],
  gridText: ['#7C87AA', '#B7C0DE', '#E8FFE6', '#07210F', '#07210F'] as readonly [string, string, string, string, string],
};

export type Colors = typeof light;

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
  mono: 'JetBrainsMono_700Bold',
} as const;

export const radius = { sm: 10, md: 14, lg: 22, pill: 999 } as const;
export const border = 2.5;
export const shadowOffset = 3;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

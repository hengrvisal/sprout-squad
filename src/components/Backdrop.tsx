import { LinearGradient } from 'expo-linear-gradient';
import { useId } from 'react';
import { StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { GradientName, useColors } from '@/theme/tokens';

/** Two soft glows per page, on top of the page's gradient. */
const GLOWS: Record<GradientName, [string, string]> = {
  today: ['#B5D3A0', '#E6D7B4'], // sage, sand
  month: ['#A9CF95', '#CFE0B8'], // meadow
  focus: ['#E8C29E', '#DDB7A0'], // warm sand, clay
  rest: ['#B6D2D4', '#C4DBC0'], // mist, sage
  squad: ['#B9D6E0', '#BFDDA6'], // sky, grass
  me: ['#CFD9C2', '#DCD3BD'], // lichen, stone
  detail: ['#CFD9C2', '#DCD3BD'],
};

/** Full-screen gradient background with a couple of soft coloured glows. */
export function Backdrop({ name }: { name: GradientName }) {
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [a, b] = GLOWS[name];
  const strength = useColorScheme() === 'dark' ? 0.08 : 0.28; // just a hint of light, barely there in dark mode
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={c.gradients[name]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={`a${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={a} stopOpacity={strength} />
            <Stop offset="1" stopColor={a} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`b${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={b} stopOpacity={strength} />
            <Stop offset="1" stopColor={b} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={width * 0.95} cy={height * 0.08} r={width * 0.75} fill={`url(#a${id})`} />
        <Circle cx={width * 0.05} cy={height * 0.72} r={width * 0.8} fill={`url(#b${id})`} />
      </Svg>
    </View>
  );
}

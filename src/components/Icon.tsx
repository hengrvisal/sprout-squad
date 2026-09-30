import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName = 'today' | 'month' | 'focus' | 'squad' | 'me' | 'gear' | 'share' | 'play' | 'pause' | 'reset' | 'skip' | 'chevron-down';

/** Simple rounded line icons (24×24), so the chrome stays quiet. */
export function Icon({ name, size = 22, color, stroke = 2 }: { name: IconName; size?: number; color: string; stroke?: number }) {
  const p = { stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'today' && (
        <>
          <Path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" {...p} />
          <Path d="M13.5 6.5l4 4" {...p} />
        </>
      )}
      {name === 'month' && (
        <>
          <Rect x={4} y={4} width={7} height={7} rx={2} {...p} />
          <Rect x={13} y={4} width={7} height={7} rx={2} {...p} />
          <Rect x={4} y={13} width={7} height={7} rx={2} {...p} />
          <Rect x={13} y={13} width={7} height={7} rx={2} {...p} fill={color} />
        </>
      )}
      {name === 'focus' && (
        <>
          <Circle cx={12} cy={13} r={7.5} {...p} />
          <Path d="M12 9.5V13l2.5 2M10 2.5h4" {...p} />
        </>
      )}
      {name === 'squad' && (
        <>
          <Path d="M12 21v-9" {...p} />
          <Path d="M12 12C12 7.5 9 5 4.5 5 4.5 9.5 7.5 12 12 12Z" {...p} />
          <Path d="M12 14.5c0-3.8 2.6-6 6.5-6 0 3.8-2.6 6-6.5 6Z" {...p} />
        </>
      )}
      {name === 'me' && (
        <>
          <Circle cx={12} cy={8.5} r={4} {...p} />
          <Path d="M4.5 20.5c1.2-3.8 4.1-5.5 7.5-5.5s6.3 1.7 7.5 5.5" {...p} />
        </>
      )}
      {name === 'gear' && (
        <>
          <Circle cx={12} cy={12} r={3} {...p} />
          <Path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" {...p} />
        </>
      )}
      {name === 'share' && (
        <>
          <Path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" {...p} />
          <Path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5" {...p} />
        </>
      )}
      {name === 'play' && <Path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill={color} stroke={color} strokeWidth={stroke} strokeLinejoin="round" />}
      {name === 'pause' && (
        <>
          <Rect x={6.5} y={5} width={4} height={14} rx={1.5} fill={color} />
          <Rect x={13.5} y={5} width={4} height={14} rx={1.5} fill={color} />
        </>
      )}
      {name === 'reset' && (
        <>
          <Path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" {...p} />
          <Path d="M4.5 3.5v4h4" {...p} />
        </>
      )}
      {name === 'skip' && (
        <>
          <Path d="M6 5.5v13l9-6.5-9-6.5Z" {...p} />
          <Path d="M18.5 5.5v13" {...p} />
        </>
      )}
      {name === 'chevron-down' && <Path d="M6 9.5l6 6 6-6" {...p} />}
    </Svg>
  );
}

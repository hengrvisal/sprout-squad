import { useId, useMemo } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { MEMBER_COLORS, plantModel } from '@/lib/plant';
import { useColors } from '@/theme/tokens';

const LEAF = 'M0,0 C 12,-16 38,-20 58,-4 C 42,14 14,14 0,0 Z';
const RIB = 'M4,-1 C 18,-6 34,-7 50,-4';

/** The squad plant, drawn in the app's chunky style (ink outlines, hard shadows). */
export function Plant({
  stage,
  progress,
  health,
  drooping,
  members,
  seedKey,
  size = 200,
}: {
  stage: number;
  progress: number;
  health: number;
  drooping: boolean;
  members: { recent_days: number }[];
  seedKey: string;
  size?: number;
}) {
  const c = useColors();
  const model = useMemo(
    () => plantModel(stage, progress, health, drooping, members, seedKey),
    [stage, progress, health, drooping, members, seedKey],
  );
  // unique per instance: two plants on screen (or a hidden tab) must not share gradient ids
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const leafFill = drooping ? `url(#leafDry${uid})` : `url(#leaf${uid})`;

  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 200 220" accessibilityLabel="Squad plant">
      <Defs>
        <LinearGradient id={`leaf${uid}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#3DBB57" />
          <Stop offset="1" stopColor="#9BE07A" />
        </LinearGradient>
        <LinearGradient id={`leafDry${uid}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#8FA86A" />
          <Stop offset="1" stopColor="#C9D49A" />
        </LinearGradient>
      </Defs>

      {/* stems: ink outline, then green */}
      {model.stems.map((d, i) => (
        <Path key={`o${i}`} d={d} stroke={c.outline} strokeWidth={i === 0 ? 10 : 7} strokeLinecap="round" fill="none" />
      ))}
      {model.stems.map((d, i) => (
        <Path key={`s${i}`} d={d} stroke={drooping ? '#8FA86A' : '#3DBB57'} strokeWidth={i === 0 ? 5.5 : 3.5} strokeLinecap="round" fill="none" />
      ))}

      {/* leaves, edged in the colour of the member who grew them */}
      {model.leaves.map((l, i) => (
        <G key={`l${i}`} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.angle.toFixed(1)}) scale(${l.size.toFixed(2)})`}>
          <Path d={LEAF} fill={leafFill} stroke={c.outline} strokeWidth={3.2} strokeLinejoin="round" />
          <Path d={LEAF} fill="none" stroke={MEMBER_COLORS[l.member % MEMBER_COLORS.length]} strokeWidth={1.6} strokeLinejoin="round" />
          <Path d={RIB} fill="none" stroke="#157F3B" strokeOpacity={0.55} strokeWidth={1.6} strokeLinecap="round" />
        </G>
      ))}

      {model.blossoms.map((b, i) =>
        b.kind === 'flower' ? (
          <G key={`b${i}`} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <Circle key={a} cx={7 * Math.cos((a * Math.PI) / 180)} cy={7 * Math.sin((a * Math.PI) / 180)} r={5.5} fill="#FF9EC7" stroke={c.outline} strokeWidth={1.6} />
            ))}
            <Circle r={4} fill="#FFE45C" stroke={c.outline} strokeWidth={1.6} />
          </G>
        ) : (
          <G key={`b${i}`} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}>
            <Circle r={9} fill="#FF7A1A" stroke={c.outline} strokeWidth={2} />
            <Circle cx={-3} cy={-3} r={2.5} fill="#FFFFFF" opacity={0.7} />
          </G>
        ),
      )}

      {/* soil + pot */}
      <Ellipse cx={100} cy={167} rx={46} ry={8} fill="#4A3426" />
      {model.seed && (
        <G transform="translate(100 161) rotate(-20)">
          <Ellipse rx={9} ry={6} fill="#C9924E" stroke={c.outline} strokeWidth={2.2} />
          <Path d="M-4,-1 C -1,-3 2,-3 5,-1" stroke={c.outline} strokeWidth={1.4} fill="none" />
        </G>
      )}
      <Path d="M58 178 L142 178 L132 216 L68 216 Z" fill="#D98A62" stroke={c.outline} strokeWidth={2.4} strokeLinejoin="round" />
      <Rect x={50} y={166} width={100} height={16} rx={6} fill="#E4A27E" stroke={c.outline} strokeWidth={2.4} />
    </Svg>
  );
}

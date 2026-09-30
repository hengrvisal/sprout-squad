import { useId, useMemo } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { MEMBER_COLORS, plantModel } from '@/lib/plant';

// A pointed, slightly asymmetric leaf along +x (base at 0,0, tip at ~60,-2).
const LEAF = 'M0,0 C 7,-13 30,-19 60,-2 C 36,11 11,11 0,0 Z';
const LEAF_TOP = 'M0,0 C 7,-13 30,-19 60,-2 C 40,-5 18,-4 0,0 Z';
const MIDRIB = 'M2,0 C 20,-3 40,-4 57,-2';
const VEINS = ['M16,-2 L 24,-10', 'M28,-3 L 37,-11', 'M40,-3 L 47,-8', 'M18,-1 L 25,5', 'M31,-2 L 39,4'];

/**
 * The squad plant, painted rather than outlined: shaded stems, veined leaves with a light
 * and a dark side, glossy flowers and fruit, a terracotta pot with rich soil.
 * Each leaf's midrib is tinted with the colour of the squadmate who grew it.
 */
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
  const model = useMemo(() => plantModel(stage, progress, health, drooping, members, seedKey), [stage, progress, health, drooping, members, seedKey]);
  // unique per instance: two plants on screen (or a hidden page) must not share gradient ids
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const dry = drooping;
  const leafA = dry ? '#8A9A5B' : '#2F8A3E';
  const leafB = dry ? '#C9C28A' : '#9AD86A';
  const stemDark = dry ? '#6F7D45' : '#2E6E31';
  const stemLight = dry ? '#A7B06E' : '#6FBF4F';
  const mainW = 3.5 + stage * 0.9;

  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 200 220" accessibilityLabel="Squad plant">
      <Defs>
        <LinearGradient id={`leaf${u}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={leafA} />
          <Stop offset="1" stopColor={leafB} />
        </LinearGradient>
        <LinearGradient id={`stem${u}`} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={stemDark} />
          <Stop offset="1" stopColor={stemLight} />
        </LinearGradient>
        <LinearGradient id={`pot${u}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#EBAE86" />
          <Stop offset="0.45" stopColor="#D98A62" />
          <Stop offset="1" stopColor="#A95E40" />
        </LinearGradient>
        <LinearGradient id={`rim${u}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#F0B994" />
          <Stop offset="0.5" stopColor="#DE946B" />
          <Stop offset="1" stopColor="#B4674A" />
        </LinearGradient>
        <RadialGradient id={`soil${u}`} cx="50%" cy="40%" r="60%">
          <Stop offset="0" stopColor="#6B4A33" />
          <Stop offset="1" stopColor="#3A281C" />
        </RadialGradient>
        <RadialGradient id={`petal${u}`} cx="30%" cy="30%" r="80%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F7A8C4" />
        </RadialGradient>
        <RadialGradient id={`fruit${u}`} cx="35%" cy="30%" r="75%">
          <Stop offset="0" stopColor="#FFB38A" />
          <Stop offset="0.55" stopColor="#F0643C" />
          <Stop offset="1" stopColor="#B83A22" />
        </RadialGradient>
        <RadialGradient id={`shadow${u}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#000000" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* ground shadow under the pot */}
      <Ellipse cx={100} cy={214} rx={62} ry={9} fill={`url(#shadow${u})`} />

      {/* stems: a darker body, then a thin light edge for roundness */}
      {model.stems.map((d, i) => (
        <Path key={`s${i}`} d={d} stroke={`url(#stem${u})`} strokeWidth={i === 0 ? mainW : mainW * 0.62} strokeLinecap="round" fill="none" />
      ))}
      {model.stems.map((d, i) => (
        <Path key={`h${i}`} d={d} stroke={stemLight} strokeOpacity={0.55} strokeWidth={i === 0 ? 1.4 : 1} strokeLinecap="round" fill="none" transform="translate(-1 0)" />
      ))}

      {/* leaves */}
      {model.leaves.map((l, i) => (
        <G key={`l${i}`} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.angle.toFixed(1)}) scale(${l.size.toFixed(2)})`}>
          <Path d="M0,0 L 6,-0.5" stroke={stemDark} strokeWidth={2.4} strokeLinecap="round" />
          <G transform="translate(4 0)">
            <Path d={LEAF} fill={`url(#leaf${u})`} />
            <Path d={LEAF_TOP} fill="#FFFFFF" opacity={0.14} />
            {VEINS.map((v) => (
              <Path key={v} d={v} stroke={dry ? '#6F7D45' : '#1F5E27'} strokeOpacity={0.28} strokeWidth={0.9} strokeLinecap="round" />
            ))}
            <Path d={MIDRIB} fill="none" stroke={MEMBER_COLORS[l.member % MEMBER_COLORS.length]} strokeOpacity={0.9} strokeWidth={1.5} strokeLinecap="round" />
          </G>
        </G>
      ))}

      {/* flowers and fruit */}
      {model.blossoms.map((b, i) =>
        b.kind === 'flower' ? (
          <G key={`b${i}`} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${i * 23})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <Ellipse
                key={a}
                cx={7 * Math.cos((a * Math.PI) / 180)}
                cy={7 * Math.sin((a * Math.PI) / 180)}
                rx={6.5}
                ry={4.6}
                fill={`url(#petal${u})`}
                transform={`rotate(${a} ${7 * Math.cos((a * Math.PI) / 180)} ${7 * Math.sin((a * Math.PI) / 180)})`}
              />
            ))}
            <Circle r={3.8} fill="#F6C945" />
            <Circle cx={-1} cy={-1} r={1.2} fill="#FFF3B0" />
          </G>
        ) : (
          <G key={`b${i}`} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}>
            <Circle r={9} fill={`url(#fruit${u})`} />
            <Ellipse cx={-3} cy={-4} rx={2.6} ry={1.6} fill="#FFFFFF" opacity={0.7} />
            <Path d="M0,-9 l -4,-3 M0,-9 l 4,-3 M0,-9 l 0,-4" stroke="#2E6E31" strokeWidth={1.6} strokeLinecap="round" />
          </G>
        ),
      )}

      {/* soil */}
      <Ellipse cx={100} cy={168} rx={45} ry={8.5} fill={`url(#soil${u})`} />
      {[
        [80, 167, 2.2],
        [112, 169, 1.8],
        [124, 166, 1.4],
        [92, 170, 1.3],
      ].map(([x, y, r], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.7} fill="#8C6A4E" opacity={0.8} />
      ))}
      {model.seed && (
        <G transform="translate(100 162) rotate(-20)">
          <Ellipse rx={9} ry={6} fill="#C9924E" />
          <Ellipse cx={-2} cy={-2} rx={4} ry={2} fill="#E4B77A" opacity={0.8} />
        </G>
      )}

      {/* pot */}
      <Path d="M58 178 L142 178 L133 214 Q 132 217 128 217 L72 217 Q 68 217 67 214 Z" fill={`url(#pot${u})`} />
      <Path d="M58 178 L142 178 L140.5 184 L59.5 184 Z" fill="#000000" opacity={0.12} />
      <Path d="M70 186 L 66 210" stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={3} strokeLinecap="round" />
      <Path d="M50 172 Q 50 166 56 166 L144 166 Q 150 166 150 172 L150 176 Q 150 182 144 182 L56 182 Q 50 182 50 176 Z" fill={`url(#rim${u})`} />
      <Path d="M56 168.5 L 144 168.5" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

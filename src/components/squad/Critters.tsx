import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

/** A looping 0→1 clock. */
function useLoop(duration: number, delay = 0) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [t, duration, delay]);
  return t;
}

/** Sample a closed path (x(u), y(u)) into interpolation arrays. */
function track(fx: (u: number) => number, fy: (u: number) => number, n = 24) {
  const input = Array.from({ length: n + 1 }, (_, i) => i / n);
  return { input, xs: input.map(fx), ys: input.map(fy) };
}

/**
 * A bee flying a lazy figure-eight around (cx, cy). Wings flutter; it turns to face the way
 * it's going.
 */
export function Bee({ cx, cy, rx, ry, duration, delay = 0, scale = 1 }: { cx: number; cy: number; rx: number; ry: number; duration: number; delay?: number; scale?: number }) {
  const t = useLoop(duration, delay);
  const wing = useLoop(160);
  const { input, xs, ys } = track(
    (u) => cx + rx * Math.sin(u * 2 * Math.PI),
    (u) => cy + ry * Math.sin(u * 4 * Math.PI) + 6 * Math.sin(u * 10 * Math.PI),
  );
  // facing: sign of dx/du
  const face = input.map((u) => (Math.cos(u * 2 * Math.PI) >= 0 ? 1 : -1));
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -13,
        top: -11,
        transform: [
          { translateX: t.interpolate({ inputRange: input, outputRange: xs }) },
          { translateY: t.interpolate({ inputRange: input, outputRange: ys }) },
          { scaleX: t.interpolate({ inputRange: input, outputRange: face.map((f) => f * scale) }) },
          { scaleY: scale },
        ],
      }}
    >
      <Svg width={26} height={22} viewBox="0 0 26 22">
        <Ellipse cx={12} cy={14} rx={8} ry={6} fill="#F6C945" />
        <Path d="M9 8.6 Q 10 14 9 19.4 M13 8 Q 14 14 13 20 M17 9 Q 18 14 17 19" stroke="#2A2118" strokeWidth={2} fill="none" />
        <Circle cx={20} cy={13} r={3.6} fill="#2A2118" />
        <Circle cx={21} cy={12} r={0.9} fill="#FFFFFF" />
        <Path d="M4 14 L 1 15" stroke="#2A2118" strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
      <Animated.View style={{ position: 'absolute', left: 6, top: 0, transform: [{ scaleY: wing.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.35, 1] }) }] }}>
        <Svg width={14} height={10} viewBox="0 0 14 10">
          <Ellipse cx={5} cy={6} rx={4.5} ry={3.6} fill="#FFFFFF" opacity={0.85} />
          <Ellipse cx={10} cy={6} rx={3.6} ry={3} fill="#FFFFFF" opacity={0.7} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** A butterfly drifting in a wide, lazy loop. */
export function Butterfly({ cx, cy, rx, ry, duration, color = '#F59BC0' }: { cx: number; cy: number; rx: number; ry: number; duration: number; color?: string }) {
  const t = useLoop(duration);
  const flap = useLoop(420);
  const { input, xs, ys } = track(
    (u) => cx + rx * Math.cos(u * 2 * Math.PI),
    (u) => cy + ry * Math.sin(u * 2 * Math.PI) + 8 * Math.sin(u * 8 * Math.PI),
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -11,
        top: -9,
        transform: [{ translateX: t.interpolate({ inputRange: input, outputRange: xs }) }, { translateY: t.interpolate({ inputRange: input, outputRange: ys }) }],
      }}
    >
      <Animated.View style={{ transform: [{ scaleX: flap.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.25, 1] }) }] }}>
        <Svg width={22} height={18} viewBox="0 0 22 18">
          <G>
            <Path d="M11 9 C 4 0, 0 4, 3 9 C 0 14, 5 17, 11 10 Z" fill={color} />
            <Path d="M11 9 C 18 0, 22 4, 19 9 C 22 14, 17 17, 11 10 Z" fill={color} />
            <Circle cx={5} cy={6} r={1.4} fill="#FFFFFF" opacity={0.8} />
            <Circle cx={17} cy={6} r={1.4} fill="#FFFFFF" opacity={0.8} />
            <Ellipse cx={11} cy={9.5} rx={1.2} ry={4.5} fill="#3A2A20" />
          </G>
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** A glowing firefly that wanders and pulses (night mode's bees). */
export function Firefly({ x, y, duration, delay = 0 }: { x: number; y: number; duration: number; delay?: number }) {
  const t = useLoop(duration, delay);
  const { input, xs, ys } = track(
    (u) => x + 18 * Math.sin(u * 2 * Math.PI) + 6 * Math.sin(u * 6 * Math.PI),
    (u) => y + 12 * Math.cos(u * 2 * Math.PI),
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -8,
        top: -8,
        opacity: t.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0.2, 1, 0.3, 0.9, 0.25, 0.2] }),
        transform: [{ translateX: t.interpolate({ inputRange: input, outputRange: xs }) }, { translateY: t.interpolate({ inputRange: input, outputRange: ys }) }],
      }}
    >
      <Svg width={16} height={16}>
        <Circle cx={8} cy={8} r={7} fill="#F9F3A0" opacity={0.25} />
        <Circle cx={8} cy={8} r={2.6} fill="#FFF7B8" />
      </Svg>
    </Animated.View>
  );
}

/** Pollen / sparkle motes rising slowly through the scene. */
export function Mote({ x, bottom, height, duration, delay }: { x: number; bottom: number; height: number; duration: number; delay: number }) {
  const t = useLoop(duration, delay);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x,
        top: bottom,
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#FFF6C8',
        opacity: t.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.9, 0.6, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -height] }) },
          { translateX: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 6, 0, -6, 0] }) },
        ],
      }}
    />
  );
}

/** Slowly turning sun rays. */
export function SunRays({ x, y, r }: { x: number; y: number; r: number }) {
  const t = useLoop(40000);
  const s = r * 2 + 40;
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, transform: [{ rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}
    >
      <Svg width={s} height={s}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * 2 * Math.PI;
          const r1 = r + 6;
          const r2 = r + (i % 2 ? 14 : 20);
          return (
            <Path
              key={i}
              d={`M${s / 2 + r1 * Math.cos(a)} ${s / 2 + r1 * Math.sin(a)} L ${s / 2 + r2 * Math.cos(a)} ${s / 2 + r2 * Math.sin(a)}`}
              stroke="#FFD65A"
              strokeOpacity={0.7}
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </Animated.View>
  );
}

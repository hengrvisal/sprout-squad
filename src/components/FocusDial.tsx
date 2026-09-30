import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '@/theme/tokens';

/**
 * The focus timer's face, and a dial you can turn.
 * - Idle: drag the knob around the ring to set the length (one full turn = 60 min; keep
 *   going round for longer). Tap to start.
 * - Running / paused: the arc counts down. Tap to pause / resume.
 * While you're turning it, the pager is locked so the page doesn't swipe away.
 */
export function FocusDial({
  size,
  value,
  colors,
  editable,
  minutes,
  onTurn,
  onTap,
  onDragChange,
  children,
}: {
  size: number;
  /** 0..1 of the circle to fill. */
  value: number;
  colors: [string, string];
  /** Whether turning is allowed (idle). */
  editable: boolean;
  /** Current length in minutes (used as the starting point for a turn). */
  minutes: number;
  /** Called with the dial position in turns (1 = 60 min); the knob follows the finger. */
  onTurn: (turns: number) => void;
  onTap: () => void;
  onDragChange?: (dragging: boolean) => void;
  children: ReactNode;
}) {
  const c = useColors();
  const stroke = 16;
  const r = size / 2 - stroke;
  const len = 2 * Math.PI * r;
  const v = Math.max(0.0001, Math.min(1, value));
  const angle = v * 2 * Math.PI - Math.PI / 2;
  const [press] = useState(() => new Animated.Value(0));

  // everything the gesture needs, kept current without rebuilding the responder
  const live = useRef({ editable, minutes, onTurn, onTap, onDragChange });
  useEffect(() => {
    live.current = { editable, minutes, onTurn, onTap, onDragChange };
  });
  const box = useRef<View>(null);
  const g = useRef({ cx: 0, cy: 0, prev: 0, turns: 0, start: 0, moved: 0, t0: 0, dragging: false });

  // refs are only read inside gesture callbacks, never during render
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => {
    const angleAt = (x: number, y: number) => Math.atan2(x - g.current.cx, -(y - g.current.cy)); // 0 at 12 o'clock, clockwise
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        g.current.moved = 0;
        g.current.t0 = Date.now();
        g.current.start = live.current.minutes;
        g.current.dragging = false;
        Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
        box.current?.measureInWindow((x, y, w, h) => {
          g.current.cx = x + w / 2;
          g.current.cy = y + h / 2;
          const a = angleAt(pageX, pageY);
          g.current.prev = a;
          // put the knob under the finger, on the lap closest to the current length
          const frac = ((a / (2 * Math.PI)) % 1 + 1) % 1;
          const cur = g.current.start / 60;
          const lap = Math.floor(cur);
          g.current.turns = [lap - 1, lap, lap + 1].map((l) => l + frac).reduce((best, t) => (Math.abs(t - cur) < Math.abs(best - cur) ? t : best));
        });
      },
      onPanResponderMove: (e, gs) => {
        g.current.moved = Math.max(g.current.moved, Math.hypot(gs.dx, gs.dy));
        if (!live.current.editable || g.current.moved < 6 || !g.current.cx) return;
        if (!g.current.dragging) {
          g.current.dragging = true;
          live.current.onDragChange?.(true);
        }
        const a = angleAt(e.nativeEvent.pageX, e.nativeEvent.pageY);
        let d = a - g.current.prev;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        g.current.prev = a;
        g.current.turns += d / (2 * Math.PI);
        live.current.onTurn(g.current.turns);
      },
      onPanResponderRelease: () => {
        Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
        if (g.current.dragging) live.current.onDragChange?.(false);
        else if (g.current.moved < 8 && Date.now() - g.current.t0 < 500) live.current.onTap();
        g.current.dragging = false;
      },
      onPanResponderTerminate: () => {
        Animated.spring(press, { toValue: 0, useNativeDriver: true }).start();
        if (g.current.dragging) live.current.onDragChange?.(false);
        g.current.dragging = false;
      },
    });
  });

  return (
    <Animated.View
      ref={box}
      {...responder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel="Timer dial"
      accessibilityHint={editable ? 'Drag around to set the length. Tap to start.' : 'Tap to pause or resume.'}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') live.current.onTurn((minutes + 5) / 60);
        if (e.nativeEvent.actionName === 'decrement') live.current.onTurn((minutes - 5) / 60);
        if (e.nativeEvent.actionName === 'activate') onTap();
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] }) }] }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="dialArc" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r - stroke / 2 - 8} fill={c.glassStrong} />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.soft} strokeWidth={stroke} fill="none" />
        {/* minute ticks every 5 min, so it reads as a dial */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const r1 = r - stroke / 2 - 16;
          const r2 = r1 - (i % 3 === 0 ? 9 : 5);
          return (
            <Line
              key={i}
              x1={size / 2 + r1 * Math.cos(a)}
              y1={size / 2 + r1 * Math.sin(a)}
              x2={size / 2 + r2 * Math.cos(a)}
              y2={size / 2 + r2 * Math.sin(a)}
              stroke={c.ink3}
              strokeOpacity={i % 3 === 0 ? 0.55 : 0.3}
              strokeWidth={i % 3 === 0 ? 2.2 : 1.6}
              strokeLinecap="round"
            />
          );
        })}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#dialArc)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${len} ${len}`}
          strokeDashoffset={len * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* the knob: bigger while you can turn it */}
        <Circle cx={size / 2 + r * Math.cos(angle)} cy={size / 2 + r * Math.sin(angle)} r={editable ? stroke / 2 + 7 : stroke / 2 + 3} fill="#FFFFFF" />
        {editable && <Circle cx={size / 2 + r * Math.cos(angle)} cy={size / 2 + r * Math.sin(angle)} r={4} fill={colors[1]} />}
      </Svg>
      {children}
    </Animated.View>
  );
}

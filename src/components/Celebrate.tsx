import * as Haptics from 'expo-haptics';
import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chunky } from '@/components/ui';
import { fonts, useColors } from '@/theme/tokens';

type Burst = { id: number; title: string; sub?: string; emoji: string[] };
type Celebrate = (b: { title: string; sub?: string; emoji?: string[] }) => void;

const Ctx = createContext<Celebrate>(() => {});

/** `celebrate({ title, sub, emoji })`: a confetti-style emoji burst, a toast and a happy haptic. */
export function useCelebrate() {
  return useContext(Ctx);
}

const DEFAULT_EMOJI = ['✨', '🌱', '🎉', '💚', '⭐'];
const PARTICLES = 16;

function Particle({ emoji, i, run, originY }: { emoji: string; i: number; run: Animated.Value; originY: number }) {
  const { width } = useWindowDimensions();
  // deterministic spread per slot so re-renders don't jitter
  const angle = (-90 + (i - PARTICLES / 2) * (150 / PARTICLES) + ((i * 37) % 11) - 5) * (Math.PI / 180);
  const dist = 140 + ((i * 53) % 90);
  const dx = Math.cos(angle) * dist;
  const dy = Math.sin(angle) * dist;
  const size = 20 + ((i * 17) % 14);
  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: width / 2 - size / 2,
        top: originY,
        fontSize: size,
        opacity: run.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: run.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
          // up, then a little gravity
          { translateY: run.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, dy, dy + 70] }) },
          { rotate: run.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 ? 1 : -1) * (90 + i * 10)}deg`] }) },
          { scale: run.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.3, 1.15, 0.8] }) },
        ],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

export function CelebrateProvider({ children }: { children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [burst, setBurst] = useState<Burst | null>(null);
  const [run] = useState(() => new Animated.Value(0));
  const [toast] = useState(() => new Animated.Value(0));
  const seq = useRef(0);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback<Celebrate>(
    ({ title, sub, emoji }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      seq.current += 1;
      setBurst({ id: seq.current, title, sub, emoji: emoji?.length ? emoji : DEFAULT_EMOJI });
      run.setValue(0);
      toast.setValue(0);
      Animated.timing(run, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.spring(toast, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }).start();
      if (hide.current) clearTimeout(hide.current);
      hide.current = setTimeout(() => {
        Animated.timing(toast, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setBurst(null));
      }, 2300);
    },
    [run, toast],
  );

  const value = useMemo(() => celebrate, [celebrate]);

  return (
    <Ctx.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {burst && (
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {Array.from({ length: PARTICLES }, (_, i) => (
              <Particle key={`${burst.id}-${i}`} i={i} emoji={burst.emoji[i % burst.emoji.length]} run={run} originY={height * 0.42} />
            ))}
            <Animated.View
              accessibilityLiveRegion="polite"
              style={{
                position: 'absolute',
                top: insets.top + 10,
                left: 18,
                right: 18,
                opacity: toast,
                transform: [
                  { translateY: toast.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) },
                  { scale: toast.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                ],
              }}
            >
              <Chunky bg={c.grid[3]} style={{ paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 28 }}>{burst.emoji[0]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.display, fontSize: 19, color: c.onGreen }}>{burst.title}</Text>
                  {burst.sub ? <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13.5, color: c.onGreen }}>{burst.sub}</Text> : null}
                </View>
              </Chunky>
            </Animated.View>
          </View>
        )}
      </View>
    </Ctx.Provider>
  );
}

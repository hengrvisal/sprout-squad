import * as Haptics from 'expo-haptics';
import { useEffect, useId, useState } from 'react';
import { Animated, Easing, Pressable, Text, useColorScheme, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Chunky } from '@/components/ui';
import type { PlantData } from '@/lib/plant';
import { healthLabel, stageFor } from '@/lib/plant';
import { fonts, radius, useColors } from '@/theme/tokens';
import { Plant } from './Plant';

const SCENE_H = 300;
const INK = '#131B33';

function Cloud({ top, size, duration, delay, width }: { top: number; size: number; duration: number; delay: number; width: number }) {
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [x, duration, delay]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: 0,
        opacity: 0.9,
        transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-size * 1.6, width + size * 0.2] }) }],
      }}
    >
      <Svg width={size * 1.6} height={size * 0.8} viewBox="0 0 80 40">
        <Path d="M12 34 C 2 34 2 20 13 20 C 13 8 32 6 36 16 C 42 6 60 8 60 20 C 74 18 76 34 64 34 Z" fill="#FFFFFF" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

/**
 * The squad plant as the hero: a little garden scene (sky, drifting clouds, hills) with the
 * plant swaying in the middle. Tap the plant to give it a wiggle; tap Details for the rest.
 */
export function Garden({
  plant,
  seedKey,
  active,
  onOpen,
}: {
  plant: PlantData;
  seedKey: string;
  /** Emoji avatars for who showed up today, and who hasn't yet. */
  active: { id: string; emoji: string; on: boolean; name: string }[];
  onOpen: () => void;
}) {
  const c = useColors();
  const dark = useColorScheme() === 'dark';
  const skyId = `sky${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [width, setWidth] = useState(340);
  const [sway] = useState(() => new Animated.Value(0));
  const [poke] = useState(() => new Animated.Value(0));
  const [hearts, setHearts] = useState(0);
  const stage = stageFor(plant.growth);
  const health = healthLabel(plant.health, plant.drooping);
  const toneColor = health.tone === 'good' ? c.grid[3] : health.tone === 'ok' ? c.sky : c.tang;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sway]);

  function wiggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setHearts((h) => h + 1);
    poke.setValue(1);
    Animated.spring(poke, { toValue: 0, useNativeDriver: true, speed: 6, bounciness: 18 }).start();
  }

  const skyTop = dark ? '#0C1535' : '#8FD3FF';
  const skyBottom = dark ? '#2A3A78' : '#E3F4FF';
  const hillBack = dark ? '#1E5A36' : '#9BE07A';
  const hillFront = dark ? '#23883F' : '#5CCB5F';
  const plantSize = 210;

  return (
    <Chunky style={{ overflow: 'hidden' }}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: SCENE_H, borderTopLeftRadius: radius.lg - 3, borderTopRightRadius: radius.lg - 3, overflow: 'hidden' }}>
        <Svg width={width} height={SCENE_H} style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={skyTop} />
              <Stop offset="1" stopColor={skyBottom} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={SCENE_H} fill={`url(#${skyId})`} />
          {dark ? (
            <>
              {[
                [0.12, 30],
                [0.3, 70],
                [0.55, 22],
                [0.7, 60],
                [0.88, 36],
                [0.42, 110],
              ].map(([fx, y], i) => (
                <Circle key={i} cx={width * fx} cy={y} r={1.8} fill="#FFFFFF" opacity={0.8} />
              ))}
              <Circle cx={width - 52} cy={52} r={22} fill="#FFF3B8" stroke={INK} strokeWidth={2.5} />
              <Circle cx={width - 44} cy={46} r={18} fill={skyTop} />
            </>
          ) : (
            <>
              <Circle cx={width - 52} cy={52} r={34} fill="#FFE45C" opacity={0.35} />
              <Circle cx={width - 52} cy={52} r={24} fill="#FFE45C" stroke={INK} strokeWidth={2.5} />
            </>
          )}
          {/* hills */}
          <Path d={`M0 ${SCENE_H - 70} C ${width * 0.3} ${SCENE_H - 120}, ${width * 0.55} ${SCENE_H - 60}, ${width} ${SCENE_H - 105} L ${width} ${SCENE_H} L 0 ${SCENE_H} Z`} fill={hillBack} stroke={INK} strokeWidth={2.5} />
          <Path d={`M0 ${SCENE_H - 40} C ${width * 0.35} ${SCENE_H - 62}, ${width * 0.7} ${SCENE_H - 30}, ${width} ${SCENE_H - 52} L ${width} ${SCENE_H} L 0 ${SCENE_H} Z`} fill={hillFront} stroke={INK} strokeWidth={2.5} />
          {/* little grass tufts */}
          {[0.12, 0.26, 0.78, 0.9].map((fx, i) => (
            <Path key={i} d={`M${width * fx} ${SCENE_H - 30} l -4 -10 M${width * fx} ${SCENE_H - 30} l 0 -12 M${width * fx} ${SCENE_H - 30} l 4 -10`} stroke={INK} strokeWidth={2} strokeLinecap="round" />
          ))}
          <Ellipse cx={width / 2} cy={SCENE_H - 18} rx={70} ry={9} fill={INK} opacity={0.18} />
        </Svg>

        <Cloud top={46} size={46} duration={38000} delay={0} width={width} />
        <Cloud top={96} size={32} duration={52000} delay={9000} width={width} />

        {/* stage + health */}
        <View style={{ position: 'absolute', top: 14, left: 16, right: 110, gap: 4 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: dark ? '#DCE6FF' : INK, opacity: 0.75 }}>
            Squad plant
          </Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 32, color: dark ? '#FFFFFF' : INK, letterSpacing: -0.8 }}>{stage.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: INK, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 2 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: toneColor, borderWidth: 1, borderColor: INK }} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: INK }}>{health.label}</Text>
          </View>
        </View>

        {/* the plant */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Squad plant, ${stage.name}. Tap to wiggle`}
          onPress={wiggle}
          style={{ position: 'absolute', bottom: 8, left: width / 2 - plantSize / 2, width: plantSize }}
        >
          <Animated.View
            style={{
              transformOrigin: 'bottom',
              transform: [
                { rotate: sway.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] }) },
                { rotate: poke.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '9deg'] }) },
                { scale: poke.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
              ],
            }}
          >
            <Plant stage={stage.index} progress={stage.progress} health={plant.health} drooping={plant.drooping} members={plant.members} seedKey={seedKey} size={plantSize} />
          </Animated.View>
        </Pressable>
        {hearts > 0 && <Heart key={hearts} left={width / 2} />}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Plant details"
          onPress={onOpen}
          style={({ pressed }) => ({
            position: 'absolute',
            right: 12,
            bottom: 12,
            backgroundColor: '#FFFFFF',
            borderWidth: 2,
            borderColor: INK,
            borderRadius: radius.pill,
            paddingHorizontal: 12,
            paddingVertical: 5,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: INK }}>Details ›</Text>
        </Pressable>
      </View>

      {/* growth + who showed up */}
      <View style={{ padding: 14, gap: 10, borderTopWidth: 2.5, borderTopColor: c.line }}>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink2 }}>
              {stage.next ? `${stage.next.in} growth to ${stage.next.name}` : 'Fully grown 🌳'}
            </Text>
            {plant.today.points > 0 && <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: c.grid[4] }}>+{plant.today.points} today</Text>}
          </View>
          <View style={{ height: 14, borderRadius: 7, borderWidth: 2, borderColor: c.line, backgroundColor: c.soft, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(stage.progress * 100)}%`, height: '100%', backgroundColor: c.grid[3] }} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row' }}>
            {active.slice(0, 7).map((m, i) => (
              <View
                key={m.id}
                accessibilityLabel={`${m.name}${m.on ? ' showed up today' : ' not yet today'}`}
                style={{
                  marginLeft: i ? -8 : 0,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 2.5,
                  borderColor: m.on ? c.grid[3] : c.line,
                  backgroundColor: m.on ? c.lilac : c.soft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: m.on ? 1 : 0.55,
                }}
              >
                <Text style={{ fontSize: 15 }}>{m.emoji || '🌱'}</Text>
              </View>
            ))}
          </View>
          <Text style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 13.5, color: c.ink2 }}>
            <Text style={{ fontFamily: fonts.mono, color: c.ink }}>
              {plant.today.active}/{plant.today.members}
            </Text>{' '}
            showed up today{plant.today.full ? ' ✨' : ''}
          </Text>
        </View>
      </View>
    </Chunky>
  );
}

/** A little 💚 that floats up when you poke the plant. */
function Heart({ left }: { left: number }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.Text
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: left + 20,
        top: 110,
        fontSize: 24,
        opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }, { scale: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.2, 1] }) }],
      }}
    >
      💚
    </Animated.Text>
  );
}

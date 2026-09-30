import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useId, useState } from 'react';
import { Animated, Easing, Pressable, Text, useColorScheme, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { PlantData } from '@/lib/plant';
import { healthLabel, stageFor } from '@/lib/plant';
import { fonts, softShadow, useColors } from '@/theme/tokens';
import { Plant } from './Plant';

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
      style={{ position: 'absolute', top, left: 0, opacity: 0.85, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-size * 1.6, width + size * 0.2] }) }] }}
    >
      <Svg width={size * 1.6} height={size * 0.8} viewBox="0 0 80 40">
        <Path d="M12 34 C 2 34 2 20 13 20 C 13 8 32 6 36 16 C 42 6 60 8 60 20 C 74 18 76 34 64 34 Z" fill="#FFFFFF" />
      </Svg>
    </Animated.View>
  );
}

export type Face = { id: string; emoji: string; on: boolean; name: string; me: boolean };

/**
 * The squad page's one main thing: the plant in a little garden (sky, drifting clouds,
 * soft hills), swaying. Tap it to give it a wiggle. Under it: stage, growth, and the
 * faces of everyone in the squad (lit up if they showed up today; tap one to visit).
 */
export function Garden({ plant, seedKey, faces }: { plant: PlantData; seedKey: string; faces: Face[] }) {
  const c = useColors();
  const dark = useColorScheme() === 'dark';
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [width, setWidth] = useState(340);
  const [sway] = useState(() => new Animated.Value(0));
  const [poke] = useState(() => new Animated.Value(0));
  const [hearts, setHearts] = useState(0);
  const stage = stageFor(plant.growth);
  const health = healthLabel(plant.health, plant.drooping);
  const toneColor = health.tone === 'good' ? c.accent : health.tone === 'ok' ? c.sky : c.tang;
  const H = 330;
  const plantSize = 230;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
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

  const sky: [string, string] = dark ? ['#0F1A24', '#22323A'] : ['#BFDCE6', '#EEF4EC'];
  const hillBack = dark ? '#1F3A28' : '#C9DEAE';
  const hillFront = dark ? '#284A31' : '#A2C78A';

  return (
    <View style={[{ borderRadius: 28, overflow: 'hidden', backgroundColor: c.glassStrong }, softShadow(c, 1.4)]}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: H }}>
        <Svg width={width} height={H} style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={sky[0]} />
              <Stop offset="1" stopColor={sky[1]} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={H} fill={`url(#sky${uid})`} />
          {dark ? (
            <>
              {[
                [0.12, 34],
                [0.3, 80],
                [0.55, 24],
                [0.72, 70],
                [0.9, 40],
                [0.44, 120],
              ].map(([fx, y], i) => (
                <Circle key={i} cx={width * fx} cy={y} r={1.6} fill="#FFFFFF" opacity={0.7} />
              ))}
              <Circle cx={width - 56} cy={56} r={20} fill="#FFF3B8" />
              <Circle cx={width - 48} cy={50} r={17} fill={sky[0]} />
            </>
          ) : (
            <>
              <Circle cx={width - 56} cy={56} r={44} fill="#F3DC9A" opacity={0.3} />
              <Circle cx={width - 56} cy={56} r={24} fill="#F3D98B" />
            </>
          )}
          <Path d={`M0 ${H - 80} C ${width * 0.3} ${H - 130}, ${width * 0.55} ${H - 70}, ${width} ${H - 115} L ${width} ${H} L 0 ${H} Z`} fill={hillBack} />
          <Path d={`M0 ${H - 44} C ${width * 0.35} ${H - 68}, ${width * 0.7} ${H - 34}, ${width} ${H - 58} L ${width} ${H} L 0 ${H} Z`} fill={hillFront} />
        </Svg>

        <Cloud top={44} size={48} duration={40000} delay={0} width={width} />
        <Cloud top={100} size={32} duration={54000} delay={9000} width={width} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Squad plant, ${stage.name}. Tap to wiggle`}
          onPress={wiggle}
          style={{ position: 'absolute', bottom: 6, left: width / 2 - plantSize / 2, width: plantSize }}
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
      </View>

      <View style={{ padding: 20, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, color: c.ink, letterSpacing: -0.6 }}>{stage.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: toneColor }} />
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13.5, color: c.ink2 }}>{health.label}</Text>
            </View>
          </View>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink3, marginBottom: 2 }}>
            {stage.next ? `${stage.next.in} to ${stage.next.name}` : 'Fully grown 🌳'}
          </Text>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: c.soft, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(stage.progress * 100)}%`, height: '100%', borderRadius: 4, backgroundColor: c.accent }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row' }}>
            {faces.slice(0, 8).map((m, i) => (
              <Pressable
                key={m.id}
                disabled={m.me}
                accessibilityRole="button"
                accessibilityLabel={`${m.name}${m.on ? ', showed up today' : ', not yet today'}${m.me ? '' : '. Open'}`}
                onPress={() => router.push({ pathname: '/friend/[id]', params: { id: m.id } })}
                hitSlop={4}
                style={{
                  marginLeft: i ? -6 : 0,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: m.on ? c.accent : c.glassStrong,
                  backgroundColor: m.on ? c.card : c.soft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: m.on ? 1 : 0.55,
                }}
              >
                <Text style={{ fontSize: 17 }}>{m.emoji || '🌱'}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: c.ink2 }}>
            <Text style={{ fontFamily: fonts.bodyBold, color: c.ink }}>
              {plant.today.active} of {plant.today.members}
            </Text>{' '}
            showed up today{plant.today.full ? ' ✨' : ''}
          </Text>
        </View>
      </View>
    </View>
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
        left: left + 24,
        top: 120,
        fontSize: 24,
        opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }, { scale: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.2, 1] }) }],
      }}
    >
      💚
    </Animated.Text>
  );
}


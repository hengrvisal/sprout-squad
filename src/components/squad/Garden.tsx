import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useId, useState } from 'react';
import { Animated, Easing, Pressable, Text, useColorScheme, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { PlantData } from '@/lib/plant';
import { healthLabel, stageFor } from '@/lib/plant';
import { fonts, softShadow, useColors } from '@/theme/tokens';
import { Bee, Butterfly, Firefly, Mote, SunRays } from './Critters';
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
  const H = 340;
  const plantSize = 236;

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

  // a bright summer meadow by day, a firefly-lit one by night
  const sky: [string, string] = dark ? ['#0B1530', '#23385A'] : ['#6EC3F0', '#D9F1FF'];
  const far: [string, string] = dark ? ['#1A3326', '#15291F'] : ['#A8DB86', '#8BCB6C'];
  const near: [string, string] = dark ? ['#20472D', '#183822'] : ['#7ACB5B', '#4FA83F'];
  const treeC = dark ? '#16301F' : '#5DAA4A';
  const flowers = ['#FFFFFF', '#FFD84D', '#F59BC0', '#B99CF0'];
  const thriving = !plant.drooping;
  const sunX = width - 58;

  return (
    <View style={[{ borderRadius: 28, overflow: 'hidden', backgroundColor: c.glassStrong }, softShadow(c, 1.4)]}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: H }}>
        <Svg width={width} height={H} style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={sky[0]} />
              <Stop offset="1" stopColor={sky[1]} />
            </LinearGradient>
            <LinearGradient id={`far${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={far[0]} />
              <Stop offset="1" stopColor={far[1]} />
            </LinearGradient>
            <LinearGradient id={`near${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={near[0]} />
              <Stop offset="1" stopColor={near[1]} />
            </LinearGradient>
            <RadialGradient id={`glow${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={dark ? '#FFF3B8' : '#FFF4B0'} stopOpacity={dark ? 0.35 : 0.8} />
              <Stop offset="1" stopColor={dark ? '#FFF3B8' : '#FFF4B0'} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={H} fill={`url(#sky${uid})`} />
          <Circle cx={sunX} cy={58} r={70} fill={`url(#glow${uid})`} />
          {dark ? (
            <>
              {[
                [0.08, 30],
                [0.22, 74],
                [0.36, 22],
                [0.5, 58],
                [0.63, 18],
                [0.3, 118],
                [0.12, 100],
                [0.56, 104],
              ].map(([fx, y], i) => (
                <Circle key={i} cx={width * fx} cy={y} r={i % 3 ? 1.3 : 1.9} fill="#FFFFFF" opacity={0.75} />
              ))}
              <Circle cx={sunX} cy={58} r={21} fill="#FFF3B8" />
              <Circle cx={sunX + 9} cy={51} r={18} fill={sky[0]} />
            </>
          ) : (
            <Circle cx={sunX} cy={58} r={24} fill="#FFD84D" />
          )}
          {/* far hill with a little tree line */}
          <Path d={`M0 ${H - 88} C ${width * 0.28} ${H - 140}, ${width * 0.58} ${H - 78}, ${width} ${H - 124} L ${width} ${H} L 0 ${H} Z`} fill={`url(#far${uid})`} />
          {[0.1, 0.17, 0.78, 0.86, 0.93].map((fx, i) => {
            const x = width * fx;
            const yBase = H - (fx < 0.5 ? 106 + (fx - 0.1) * 120 : 104 + (fx - 0.78) * 60);
            const r = i % 2 ? 11 : 14;
            return (
              <G key={i}>
                <Rect x={x - 1.5} y={yBase - 4} width={3} height={10} fill={dark ? '#0F2016' : '#6B5237'} />
                <Circle cx={x} cy={yBase - r} r={r} fill={treeC} />
                <Circle cx={x - r * 0.35} cy={yBase - r * 1.25} r={r * 0.55} fill="#FFFFFF" opacity={dark ? 0.03 : 0.12} />
              </G>
            );
          })}
          {/* near meadow */}
          <Path d={`M0 ${H - 48} C ${width * 0.35} ${H - 74}, ${width * 0.68} ${H - 36}, ${width} ${H - 62} L ${width} ${H} L 0 ${H} Z`} fill={`url(#near${uid})`} />
          {/* wildflowers and grass tufts */}
          {Array.from({ length: 16 }, (_, i) => {
            const fx = ((i * 0.618) % 1) * 0.94 + 0.03;
            if (fx > 0.3 && fx < 0.7) return null; // keep the middle clear for the pot
            const x = width * fx;
            const y = H - 30 + ((i * 37) % 22);
            return (
              <G key={i}>
                <Path d={`M${x} ${y + 6} q -3 -8 -6 -11 M${x} ${y + 6} q 0 -9 1 -13 M${x} ${y + 6} q 3 -7 7 -10`} stroke={dark ? '#2F5F3A' : '#3E8F35'} strokeWidth={1.6} fill="none" strokeLinecap="round" />
                {i % 2 === 0 && (
                  <>
                    <Circle cx={x + 1} cy={y - 7} r={3.2} fill={flowers[i % flowers.length]} opacity={dark ? 0.5 : 1} />
                    <Circle cx={x + 1} cy={y - 7} r={1.2} fill="#F2B632" opacity={dark ? 0.5 : 1} />
                  </>
                )}
              </G>
            );
          })}
        </Svg>

        {!dark && <SunRays x={sunX} y={58} r={24} />}
        <Cloud top={40} size={50} duration={42000} delay={0} width={width} />
        <Cloud top={96} size={34} duration={56000} delay={12000} width={width} />

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
        {/* life: bees and a butterfly by day, fireflies by night; pollen when it's thriving */}
        {thriving &&
          (dark ? (
            <>
              <Firefly x={width * 0.25} y={H - 120} duration={6000} />
              <Firefly x={width * 0.72} y={H - 150} duration={7400} delay={1200} />
              <Firefly x={width * 0.5} y={H - 210} duration={8200} delay={2600} />
              <Firefly x={width * 0.85} y={H - 90} duration={6800} delay={600} />
            </>
          ) : (
            <>
              <Bee cx={width / 2} cy={H - 170} rx={Math.min(110, width * 0.32)} ry={30} duration={9000} />
              {stage.index >= 3 && <Bee cx={width / 2 + 10} cy={H - 140} rx={70} ry={22} duration={7000} delay={1500} scale={0.85} />}
              <Butterfly cx={width * 0.28} cy={H - 110} rx={40} ry={24} duration={11000} />
            </>
          ))}
        {thriving &&
          [0.35, 0.47, 0.58, 0.66].map((fx, i) => (
            <Mote key={i} x={width * fx} bottom={H - 70} height={140} duration={5200 + i * 900} delay={i * 1300} />
          ))}
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


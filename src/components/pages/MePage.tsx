import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Screen } from '@/components/Screen';
import { Chunky, Divider, Row } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { useProfile } from '@/hooks/profile';
import { level, longestStreak, streak, yearWeeks } from '@/lib/dates';
import { badges, gardenerLevel } from '@/lib/progress';
import { fonts, radius, useColors } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Avatar inside a ring that fills with progress to your next gardener level. */
function LevelRing({ emoji, progress, size, replay }: { emoji?: string; progress: number; size: number; replay: number }) {
  const c = useColors();
  const [v] = useState(() => new Animated.Value(0));
  const stroke = 7;
  const r = size / 2 - stroke;
  const len = 2 * Math.PI * r;
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: progress, duration: 1100, delay: 150, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [v, progress, replay]);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="lvl" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#9AD86A" />
            <Stop offset="1" stopColor="#3F8746" />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.soft} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#lvl)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${len} ${len}`}
          strokeDashoffset={v.interpolate({ inputRange: [0, 1], outputRange: [len, 0] })}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ width: size - 26, height: size - 26, borderRadius: size, backgroundColor: c.glassStrong, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.42 }}>{emoji || '🌱'}</Text>
      </View>
    </View>
  );
}

function CountUp({ value, replay, style }: { value: number; replay: number; style: object }) {
  const [v] = useState(() => new Animated.Value(0));
  const [shown, setShown] = useState(0);
  useEffect(() => {
    v.setValue(0);
    const id = v.addListener(({ value: x }) => setShown(Math.round(x)));
    Animated.timing(v, { toValue: value, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [v, value, replay]);
  return <Text style={style}>{shown}</Text>;
}

/** The whole year, GitHub-style: one column per week, sweeping in from the left. */
function YearGraph({ weeks, width, replay }: { weeks: ReturnType<typeof yearWeeks>; width: number; replay: number }) {
  const c = useColors();
  const gap = 2;
  const cell = Math.max(3, Math.floor((width - gap * (weeks.length - 1)) / weeks.length));
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [v, replay]);
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {weeks.map((w, wi) => {
        const at = wi / Math.max(1, weeks.length - 1);
        return (
          <Animated.View
            key={wi}
            style={{
              gap,
              opacity: v.interpolate({ inputRange: [Math.max(0, at - 0.2), Math.min(1, at + 0.001)], outputRange: [0, 1], extrapolate: 'clamp' }),
            }}
          >
            {w.map((d, di) => (
              <View
                key={di}
                style={{ width: cell, height: cell, borderRadius: Math.min(3, cell / 3), backgroundColor: d ? c.grid[level(d.count)] : 'transparent' }}
              />
            ))}
          </Animated.View>
        );
      })}
    </View>
  );
}

/** Me: your gardener level, your year in green, your badges. Settings at the bottom. */
export function MePage({ active }: { active: boolean }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const { counts } = useEntries();
  const [replay, setReplay] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const year = new Date().getFullYear();
  const thisYear = Object.entries(counts).filter(([k, n]) => k.startsWith(`${year}-`) && n > 0);
  const total = Object.values(counts).reduce((a, n) => a + Math.max(0, n), 0);
  const lvl = gardenerLevel(total);
  const all = badges(counts);
  const earned = all.filter((b) => b.earned).length;
  const pickedBadge = all.find((b) => b.id === picked);
  const stats: [number, string][] = [
    [streak(counts), 'day streak'],
    [longestStreak(counts), 'best streak'],
    [thisYear.length, `green days`],
  ];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- replay the animations when the page is shown
    if (active) setReplay((n) => n + 1);
  }, [active]);

  return (
    <Screen gradient="me" title="Me">
      {/* you + your level */}
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => router.push('/profile')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <LevelRing emoji={profile?.emoji} progress={lvl.progress} size={116} replay={replay} />
        </Pressable>
        <Text numberOfLines={1} style={{ fontFamily: fonts.display, fontSize: 28, color: c.ink, letterSpacing: -0.6 }}>
          {profile?.display_name || 'Add your name'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.glassStrong, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 }}>
          <Text style={{ fontSize: 15 }}>{lvl.emoji}</Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: c.ink }}>
            Level {lvl.index} · {lvl.name}
          </Text>
        </View>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.ink3 }}>
          {lvl.next ? `${lvl.toNext} more ${lvl.toNext === 1 ? 'win' : 'wins'} to ${lvl.next.name} ${lvl.next.emoji}` : 'Top level. A whole forest of wins 🌲'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {stats.map(([n, label]) => (
          <View key={label} style={{ alignItems: 'center' }}>
            <CountUp value={n} replay={replay} style={{ fontFamily: fonts.display, fontSize: 28, color: c.ink }} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.ink3 }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* the year */}
      <Chunky style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 17, color: c.ink }}>{year} in green</Text>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.accent }}>{thisYear.reduce((a, [, n]) => a + n, 0)} things done</Text>
        </View>
        <YearGraph weeks={yearWeeks(counts)} width={width - 40 - 32 - 2} replay={replay} />
      </Chunky>

      {/* badges */}
      <Chunky style={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 17, color: c.ink }}>Badges</Text>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink3 }}>
            {earned} of {all.length}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
          {all.map((b) => (
            <Pressable
              key={b.id}
              accessibilityRole="button"
              accessibilityLabel={`${b.name}. ${b.earned ? 'Earned' : `Locked: ${b.how}`}`}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setPicked((p) => (p === b.id ? null : b.id));
              }}
              style={{ width: '25%', alignItems: 'center', gap: 5 }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: b.earned ? '#FFF1C9' : c.soft,
                  borderWidth: picked === b.id ? 2 : 0,
                  borderColor: c.accent,
                  transform: [{ scale: picked === b.id ? 1.08 : 1 }],
                }}
              >
                <Text style={{ fontSize: 25, opacity: b.earned ? 1 : 0.25 }}>{b.emoji}</Text>
                {!b.earned && <Text style={{ position: 'absolute', right: 2, bottom: 0, fontSize: 13 }}>🔒</Text>}
              </View>
              <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, color: b.earned ? c.ink2 : c.ink3 }}>
                {b.name}
              </Text>
            </Pressable>
          ))}
        </View>
        {pickedBadge && (
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.ink, textAlign: 'center' }}>
            {pickedBadge.emoji} {pickedBadge.name}: {pickedBadge.earned ? `earned! (${pickedBadge.how.toLowerCase()})` : pickedBadge.how.toLowerCase()}
          </Text>
        )}
      </Chunky>

      <Chunky style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
        <Row label="Edit profile" onPress={() => router.push('/profile')} />
        <Divider />
        <Row label="Your last 7 days" onPress={() => router.push('/week')} />
        <Divider />
        <Row label="Search your wins" onPress={() => router.push('/search')} />
        <Divider />
        <Row label="Notifications" onPress={() => router.push('/notifications')} />
        <Divider />
        <Row label="Account & privacy" onPress={() => router.push('/account')} />
      </Chunky>
    </Screen>
  );
}

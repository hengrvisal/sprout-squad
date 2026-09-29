import { useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonthGrid } from '@/components/MonthGrid';
import { Avatar } from '@/components/Screen';
import { Body, Button, Chunky, Dot, Eyebrow, Mono } from '@/components/ui';
import { useProfile } from '@/hooks/profile';
import { categoryColor } from '@/lib/categories';
import { DayCounts, monthAt, monthRange, ymd } from '@/lib/dates';
import { fonts, radius, useColors } from '@/theme/tokens';

/** Deterministic example counts for the current month, so the illustrations look alive. */
function sampleCounts(seed: number, rate: number): DayCounts {
  const { y, m } = monthAt(0);
  const { from } = monthRange(y, m);
  const out: DayCounts = {};
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const d = new Date(`${from}T00:00:00`);
  const today = new Date();
  while (d <= today) {
    if (rnd() < rate) out[ymd(d)] = 1 + Math.floor(rnd() * 5);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function Title({ children }: { children: string }) {
  const c = useColors();
  return (
    <Text style={{ fontFamily: fonts.display, fontSize: 38, lineHeight: 40, color: c.ink, letterSpacing: -1 }}>{children}</Text>
  );
}

function WelcomeSlide() {
  const c = useColors();
  const { y, m } = monthAt(0);
  const counts = useMemo(() => sampleCounts(7, 0.75), []);
  return (
    <View style={{ gap: 22 }}>
      <View style={{ gap: 10 }}>
        <Eyebrow>Welcome</Eyebrow>
        <Title>Welcome to Sprout Squad</Title>
        <Body style={{ fontSize: 16, color: c.ink2 }}>
          Each day, write down what you got done. Every win turns that day’s square a little greener.
        </Body>
      </View>
      <Chunky style={{ padding: 14, gap: 10 }}>
        <Eyebrow>An example month</Eyebrow>
        <MonthGrid y={y} m={m} counts={counts} mini gap={4} />
      </Chunky>
    </View>
  );
}

function PurposeSlide() {
  const c = useColors();
  const { y, m } = monthAt(0);
  const friends = useMemo(
    () => [
      { emoji: '🐸', name: 'Mia', counts: sampleCounts(11, 0.8), kudos: '🔥 3' },
      { emoji: '🐙', name: 'Jun', counts: sampleCounts(29, 0.55), kudos: '👏 2' },
      { emoji: '🌻', name: 'Ari', counts: sampleCounts(53, 0.65), kudos: '💪 4' },
    ],
    [],
  );
  return (
    <View style={{ gap: 22 }}>
      <View style={{ gap: 10 }}>
        <Eyebrow>Why</Eyebrow>
        <Title>Motivation is better with friends</Title>
        <Body style={{ fontSize: 16, color: c.ink2 }}>
          Seeing your friends’ grids fill up is a nudge to fill yours. There are no rankings and no leaderboard, just kudos
          for showing up.
        </Body>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {friends.map((f) => (
          <View key={f.name} style={{ flex: 1 }}>
            <Chunky style={{ padding: 10, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Avatar emoji={f.emoji} size={24} />
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.ink }}>{f.name}</Text>
              </View>
              <MonthGrid y={y} m={m} counts={f.counts} mini gap={2} />
              <View
                style={{
                  alignSelf: 'flex-start',
                  borderWidth: 2,
                  borderColor: c.line,
                  borderRadius: radius.pill,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  backgroundColor: c.lilac,
                }}
              >
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: c.tangInk }}>{f.kudos}</Text>
              </View>
            </Chunky>
          </View>
        ))}
      </View>
    </View>
  );
}

function HowSlide() {
  const c = useColors();
  const steps = [
    {
      title: 'Log a win',
      body: 'Anything productive counts: a lecture, a shift, a run, clearing the laundry pile.',
      demo: (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Dot color={categoryColor('study')} />
          <Body style={{ flex: 1, fontSize: 14 }}>Finished assignment draft</Body>
          <Mono style={{ fontSize: 11, color: c.ink3 }}>now</Mono>
        </View>
      ),
    },
    {
      title: 'Watch your square',
      body: 'More wins, greener square. Log something every day to keep your streak.',
      demo: (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {c.grid.map((g, i) => (
            <View key={g} style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: g, borderWidth: i === 4 ? 2.5 : 0, borderColor: c.ink }} />
          ))}
        </View>
      ),
    },
    {
      title: 'Share with your squad',
      body: 'Friends see your grid and send kudos. Squads are coming soon.',
      demo: null,
    },
  ];
  return (
    <View style={{ gap: 22 }}>
      <View style={{ gap: 10 }}>
        <Eyebrow>How it works</Eyebrow>
        <Title>Three steps, once a day</Title>
      </View>
      <View style={{ gap: 12 }}>
        {steps.map((s, i) => (
          <Chunky key={s.title} style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.grid[3], borderWidth: 2, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: fonts.display, fontSize: 13, color: c.onGreen }}>{i + 1}</Text>
              </View>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 17, color: c.ink }}>{s.title}</Text>
            </View>
            <Body style={{ fontSize: 14, color: c.ink2 }}>{s.body}</Body>
            {s.demo}
          </Chunky>
        ))}
      </View>
    </View>
  );
}

const SLIDES = [WelcomeSlide, PurposeSlide, HowSlide];

export default function Onboarding() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const { finishOnboarding } = useProfile();
  const scroller = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const last = page === SLIDES.length - 1;

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  }

  function next() {
    if (last) return finishOnboarding();
    scroller.current?.scrollTo({ x: (page + 1) * width, animated: true });
    setPage(page + 1);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.ground }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8, minHeight: 40 }}>
        {!last && (
          <Pressable accessibilityRole="button" onPress={finishOnboarding} hitSlop={10}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.ink2 }}>Skip</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={{ flex: 1 }}
      >
        {SLIDES.map((Slide, i) => (
          <ScrollView key={i} style={{ width }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, flexGrow: 1, justifyContent: 'center' }}>
            <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center' }}>
              <Slide />
            </View>
          </ScrollView>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 16, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }} accessibilityLabel={`Slide ${page + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{ width: i === page ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === page ? c.ink : c.ink3, opacity: i === page ? 1 : 0.4 }}
            />
          ))}
        </View>
        <Button label={last ? 'Start growing' : 'Next'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

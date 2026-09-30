import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Legend, MonthGrid } from '@/components/MonthGrid';
import { Screen } from '@/components/Screen';
import { Chunky } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { useEntries } from '@/hooks/entries';
import { categoryColor, categoryEmoji } from '@/lib/categories';
import { monthCheer } from '@/lib/cheer';
import { MONTHS, monthAt, monthStats, streak, ymd } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { fonts, radius, useColors } from '@/theme/tokens';

function Nav({ label, onPress, disabled, a11y }: { label: string; onPress: () => void; disabled?: boolean; a11y: string }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: c.glassStrong, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : pressed ? 0.6 : 1 })}
    >
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 24, lineHeight: 26, color: c.ink }}>{label}</Text>
    </Pressable>
  );
}

/** A number that counts up to its value. */
function CountUp({ value, style }: { value: number; style: object }) {
  const [v] = useState(() => new Animated.Value(0));
  const [shown, setShown] = useState(0);
  useEffect(() => {
    v.setValue(0);
    const id = v.addListener(({ value: x }) => setShown(Math.round(x)));
    Animated.timing(v, { toValue: value, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [v, value]);
  return <Text style={style}>{shown}</Text>;
}

type DayEntry = { id: string; text: string; category: string };

/** Month: your grid, big and alive. Tap a day to see what you did; ‹ › to look back. */
export function MonthPage({ active }: { active: boolean }) {
  const c = useColors();
  const { session } = useAuth();
  const { counts, ensureMonth, today: todayEntries } = useEntries();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [dayEntries, setDayEntries] = useState<DayEntry[] | null>(null);
  const [fill] = useState(() => new Animated.Value(0));
  const [seen, setSeen] = useState(0); // bumps each time the page comes into view, to replay the pop-in
  const { y, m } = monthAt(offset);
  const s = monthStats(counts, y, m);
  const st = streak(counts);
  const now = new Date();
  const isCurrent = offset === 0;
  const elapsed = isCurrent ? now.getDate() : new Date(y, m + 1, 0).getDate();
  const share = elapsed ? s.greenDays / elapsed : 0;
  const cheer = monthCheer(counts, y, m);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- replay the animation when the page is shown
    if (active) setSeen((n) => n + 1);
  }, [active]);

  useEffect(() => {
    fill.setValue(0);
    Animated.timing(fill, { toValue: share, duration: 900, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [fill, share, seen, offset]);

  // what you did on the tapped day (today comes from memory, other days from the server)
  const todayKey = ymd(now);
  useEffect(() => {
    if (!selected || !session) return;
    if (selected === todayKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- today's list is already in memory
      setDayEntries(todayEntries.map((e) => ({ id: e.id, text: e.text, category: e.category })));
      return;
    }
    let alive = true;
    setDayEntries(null);
    supabase
      .from('entries')
      .select('id, text, category')
      .eq('user_id', session.user.id)
      .eq('done_on', selected)
      .order('created_at')
      .then(({ data }) => alive && setDayEntries((data ?? []) as DayEntry[]));
    return () => {
      alive = false;
    };
  }, [selected, session, todayKey, todayEntries]);

  function go(o: number) {
    const next = Math.min(0, o);
    setOffset(next);
    setSelected(null);
    const mm = monthAt(next);
    ensureMonth(mm.y, mm.m);
  }

  function pick(key: string) {
    Haptics.selectionAsync().catch(() => {});
    setSelected((k) => (k === key ? null : key));
  }

  const selDate = selected ? new Date(Number(selected.slice(0, 4)), Number(selected.slice(5, 7)) - 1, Number(selected.slice(8, 10))) : null;
  const selCount = selected ? (counts[selected] ?? 0) : 0;

  return (
    <Screen
      gradient="month"
      subtitle={String(y)}
      title={MONTHS[m]}
      right={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Nav label="‹" a11y="Previous month" onPress={() => go(offset - 1)} />
          <Nav label="›" a11y="Next month" onPress={() => go(offset + 1)} disabled={offset >= 0} />
        </View>
      }
    >
      {/* the headline: green days, animated */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <CountUp key={`${offset}-${seen}`} value={s.greenDays} style={{ fontFamily: fonts.display, fontSize: 56, lineHeight: 58, color: c.accent, letterSpacing: -2 }} />
          <View style={{ paddingBottom: 8 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: c.ink }}>green {s.greenDays === 1 ? 'day' : 'days'}</Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.ink3 }}>
              out of {elapsed} {isCurrent ? 'so far' : ''}
            </Text>
          </View>
        </View>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: c.soft, overflow: 'hidden' }}>
          <Animated.View style={{ height: '100%', borderRadius: 5, backgroundColor: c.accent, width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
        </View>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: c.ink2 }}>
          {cheer.emoji} {cheer.text}
        </Text>
      </View>

      {/* the grid */}
      <Chunky style={{ padding: 16, gap: 14 }}>
        <MonthGrid key={`${offset}-${seen}`} y={y} m={m} counts={counts} gap={7} animate selected={selected} onPressDay={pick} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: c.ink3 }}>Tap a day to see it</Text>
          <Legend />
        </View>
      </Chunky>

      {/* the day you tapped, or the month's numbers */}
      {selected && selDate ? (
        <Chunky style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 17, color: c.ink }}>
              {selDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
            </Text>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: selCount ? c.accent : c.ink3 }}>
              {selCount ? `${selCount} done` : 'rest day'}
            </Text>
          </View>
          {dayEntries === null ? (
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: c.ink3 }}>Loading…</Text>
          ) : dayEntries.length === 0 ? (
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: c.ink3 }}>Nothing logged. Rest days are part of it too 🍃</Text>
          ) : (
            dayEntries.map((e) => (
              <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: categoryColor(e.category), alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14 }}>{categoryEmoji(e.category)}</Text>
                </View>
                <Text numberOfLines={1} style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: c.ink }}>
                  {e.text}
                </Text>
              </View>
            ))
          )}
        </Chunky>
      ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
          {[
            ['✅', s.items, s.items === 1 ? 'thing done' : 'things done'],
            ...(isCurrent ? [['🔥', st, 'day streak'] as const] : []),
          ].map(([e, n, label]) => (
            <View key={String(label)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.glassStrong, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 }}>
              <Text style={{ fontSize: 15 }}>{e}</Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.ink }}>{n}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.ink3 }}>{label}</Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

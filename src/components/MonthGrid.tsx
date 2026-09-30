import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { DayCounts, MONTHS, WEEKDAYS, monthCells, monthStats, plural } from '@/lib/dates';
import { fonts, useColors } from '@/theme/tokens';
import { Body, H, Mono } from './ui';

/** The GitHub-style grid, one calendar month at a time (Monday first). */
export function MonthGrid({
  y,
  m,
  counts,
  mini = false,
  gap = mini ? 3 : 6,
  animate = false,
  selected,
  onPressDay,
}: {
  y: number;
  m: number;
  counts: DayCounts;
  mini?: boolean;
  gap?: number;
  /** Cells pop in one after another (remount with a new key to replay). */
  animate?: boolean;
  selected?: string | null;
  onPressDay?: (key: string) => void;
}) {
  const c = useColors();
  const cells = monthCells(y, m, counts);
  const rows: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  const last = rows[rows.length - 1];
  while (last.length < 7) last.push({ kind: 'pad' });

  return (
    <View accessibilityLabel={`${MONTHS[m]} ${y} activity`} style={{ gap }}>
      <View style={{ flexDirection: 'row', gap }}>
        {WEEKDAYS.map((w, i) => (
          <Text
            key={i}
            style={{ flex: 1, textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: mini ? 9 : 11, color: c.ink3 }}
          >
            {w}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap }}>
          {row.map((cell, ci) => {
            if (cell.kind === 'pad') return <View key={ci} style={{ flex: 1, aspectRatio: 1 }} />;
            const r = mini ? 5 : 12;
            if (cell.isFuture) {
              return (
                <View key={ci} style={{ flex: 1, aspectRatio: 1, borderRadius: r, backgroundColor: c.soft, opacity: 0.45, padding: 5 }}>
                  {!mini && <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: c.ink3 }}>{cell.day}</Text>}
                </View>
              );
            }
            const cellEl = <DayCell cell={cell} mini={mini} r={r} selected={selected === cell.key} />;
            const tappable = onPressDay ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${cell.key}: ${plural(cell.count, 'thing', 'things')} done. Open`}
                onPress={() => onPressDay(cell.key)}
                style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.9 : 1 }] })}
              >
                {cellEl}
              </Pressable>
            ) : (
              cellEl
            );
            return animate ? (
              <PopIn key={ci} delay={(ri * 7 + ci) * 16}>
                {tappable}
              </PopIn>
            ) : (
              <View key={ci} style={{ flex: 1 }}>
                {tappable}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

type Day = Extract<ReturnType<typeof monthCells>[number], { kind: 'day' }>;

/**
 * One day. Green days are chunky (ink edge + a little shine). Today pulses gently while
 * it's still empty, as an invitation, and pops each time its count goes up.
 */
/** Springs a cell in after `delay` ms. */
function PopIn({ delay, children }: { delay: number; children: React.ReactNode }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(v, { toValue: 1, delay, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
  }, [v, delay]);
  return <Animated.View style={{ flex: 1, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>{children}</Animated.View>;
}

function DayCell({ cell, mini, r, selected }: { cell: Day; mini: boolean; r: number; selected?: boolean }) {
  const c = useColors();
  const lit = cell.level > 0;
  const body = (
    <View
      accessibilityLabel={`${cell.key}: ${plural(cell.count, 'thing', 'things')} done${cell.isToday ? ', today' : ''}`}
      style={{
        flex: 1,
        aspectRatio: 1,
        borderRadius: r,
        backgroundColor: c.grid[cell.level],
        padding: mini ? 0 : 5,
        borderWidth: selected ? 2.5 : cell.isToday ? 2 : 0,
        borderColor: selected ? c.tang : lit ? c.ink : c.tang,
      }}
    >
      {!mini && (
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: c.gridText[cell.level] }}>
          {cell.day}
        </Text>
      )}
    </View>
  );
  if (!cell.isToday) return body;
  return <TodayCell key={cell.count} empty={!lit}>{body}</TodayCell>;
}

function TodayCell({ empty, children }: { empty: boolean; children: React.ReactNode }) {
  const [v] = useState(() => new Animated.Value(empty ? 1 : 1.35));
  useEffect(() => {
    if (!empty) {
      Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 14 }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1.12, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [empty, v]);
  return <Animated.View style={{ flex: 1, zIndex: 1, transform: [{ scale: v }] }}>{children}</Animated.View>;
}

export function Legend() {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: c.ink3 }}>less</Text>
      {c.grid.map((g) => (
        <View key={g} style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: g }} />
      ))}
      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: c.ink3 }}>more</Text>
    </View>
  );
}

/** Month title with ‹ › navigation. `offset` is 0 for this month, negative for past months. */
function NavBtn({
  label,
  dir,
  offset,
  onChange,
  disabled,
}: {
  label: string;
  dir: number;
  offset: number;
  onChange: (o: number) => void;
  disabled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir < 0 ? 'Previous month' : 'Next month'}
      disabled={disabled}
      onPress={() => onChange(Math.min(0, offset + dir))}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: c.glassStrong,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 22, lineHeight: 24, color: c.ink }}>{label}</Text>
    </Pressable>
  );
}

export function MonthHeader({ y, m, offset, onChange }: { y: number; m: number; offset: number; onChange: (o: number) => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <H>
        {MONTHS[m]} <Mono style={{ fontSize: 15, color: c.ink3 }}>{y}</Mono>
      </H>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <NavBtn label="‹" dir={-1} offset={offset} onChange={onChange} />
        <NavBtn label="›" dir={1} offset={offset} onChange={onChange} disabled={offset >= 0} />
      </View>
    </View>
  );
}

export function MonthSummary({ counts, y, m }: { counts: DayCounts; y: number; m: number }) {
  const c = useColors();
  const s = monthStats(counts, y, m);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
      <Body style={{ fontSize: 13, color: c.ink2 }}>
        <Mono style={{ fontSize: 13 }}>{s.greenDays}</Mono> green {s.greenDays === 1 ? 'day' : 'days'} ·{' '}
        <Mono style={{ fontSize: 13 }}>{s.items}</Mono> {s.items === 1 ? 'thing' : 'things'} done
      </Body>
      <Legend />
    </View>
  );
}

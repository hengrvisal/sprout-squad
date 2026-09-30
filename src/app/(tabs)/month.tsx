import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Legend, MonthGrid } from '@/components/MonthGrid';
import { Screen } from '@/components/Screen';
import { Chunky } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { MONTHS, monthAt, monthStats, streak } from '@/lib/dates';
import { fonts, useColors } from '@/theme/tokens';

function Nav({ label, onPress, disabled, a11y }: { label: string; onPress: () => void; disabled?: boolean; a11y: string }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: c.glassStrong,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 24, lineHeight: 26, color: c.ink }}>{label}</Text>
    </Pressable>
  );
}

/** Month: your grid, big. ‹ › to look back. */
export default function MonthTab() {
  const c = useColors();
  const { counts, ensureMonth } = useEntries();
  const [offset, setOffset] = useState(0);
  const { y, m } = monthAt(offset);
  const s = monthStats(counts, y, m);
  const st = streak(counts);

  function go(o: number) {
    const next = Math.min(0, o);
    setOffset(next);
    const mm = monthAt(next);
    ensureMonth(mm.y, mm.m);
  }

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
      <Chunky style={{ padding: 16, gap: 16 }}>
        <MonthGrid y={y} m={m} counts={counts} gap={7} />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Legend />
        </View>
      </Chunky>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 36 }}>
        {[
          [s.greenDays, s.greenDays === 1 ? 'green day' : 'green days'],
          [s.items, s.items === 1 ? 'thing done' : 'things done'],
          ...(offset === 0 ? [[st, 'day streak'] as const] : []),
        ].map(([n, label]) => (
          <View key={String(label)} style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, color: c.ink }}>{n}</Text>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.ink3 }}>{label}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

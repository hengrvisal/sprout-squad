import { Pressable, Text, View } from 'react-native';
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
}: {
  y: number;
  m: number;
  counts: DayCounts;
  mini?: boolean;
  gap?: number;
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
            style={{ flex: 1, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: mini ? 9 : 10.5, color: c.ink3 }}
          >
            {w}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap }}>
          {row.map((cell, ci) => {
            if (cell.kind === 'pad') return <View key={ci} style={{ flex: 1, aspectRatio: 1 }} />;
            const r = mini ? 3 : 9;
            if (cell.isFuture) {
              return (
                <View
                  key={ci}
                  style={{ flex: 1, aspectRatio: 1, borderRadius: r, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.soft, padding: 3 }}
                >
                  {!mini && <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: c.ink3, opacity: 0.6 }}>{cell.day}</Text>}
                </View>
              );
            }
            return (
              <View
                key={ci}
                accessibilityLabel={`${cell.key}: ${plural(cell.count, 'thing', 'things')} done`}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: r,
                  backgroundColor: c.grid[cell.level],
                  padding: mini ? 0 : 4,
                  borderWidth: cell.isToday ? 2.5 : 0,
                  borderColor: c.ink,
                }}
              >
                {!mini && (
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: c.gridText[cell.level], opacity: cell.level ? 1 : 0.8 }}>
                    {cell.day}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
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
        width: 34,
        height: 34,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: c.line,
        backgroundColor: c.card,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text style={{ fontFamily: fonts.mono, fontSize: 20, lineHeight: 22, color: c.ink }}>{label}</Text>
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

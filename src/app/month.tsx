import { useState } from 'react';
import { View } from 'react-native';
import { MonthGrid, MonthHeader, MonthSummary } from '@/components/MonthGrid';
import { DetailScreen } from '@/components/Screen';
import { Body, Card, Mono } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { monthAt, streak } from '@/lib/dates';
import { useColors } from '@/theme/tokens';

/** Your grid, month by month, with the numbers. */
export default function Month() {
  const c = useColors();
  const { counts, ensureMonth } = useEntries();
  const [offset, setOffset] = useState(0);
  const { y, m } = monthAt(offset);
  const year = new Date().getFullYear();
  const thisYear = Object.entries(counts).filter(([k, n]) => k.startsWith(`${year}-`) && n > 0);

  return (
    <DetailScreen title="Your months">
      <Card>
        <MonthHeader y={y} m={m} offset={offset} onChange={(o) => { setOffset(o); const mm = monthAt(o); ensureMonth(mm.y, mm.m); }} />
        <MonthGrid y={y} m={m} counts={counts} />
        <MonthSummary counts={counts} y={y} m={m} />
      </Card>
      <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[
          [streak(counts), 'day streak'],
          [thisYear.length, `green days in ${year}`],
          [thisYear.reduce((a, [, n]) => a + n, 0), `things in ${year}`],
        ].map(([n, label]) => (
          <View key={String(label)} style={{ flex: 1, gap: 2 }}>
            <Mono style={{ fontSize: 24 }}>{n}</Mono>
            <Body style={{ fontSize: 12, color: c.ink3 }}>{label}</Body>
          </View>
        ))}
      </Card>
    </DetailScreen>
  );
}

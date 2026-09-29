import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { DetailScreen } from '@/components/Screen';
import { Body, Card, Dot, Eyebrow, Row } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { useRecentEntries } from '@/hooks/recent';
import { categoryColor } from '@/lib/categories';
import { weekRecap } from '@/lib/recap';
import { fonts, useColors } from '@/theme/tokens';

/** Your last 7 days: proof you've been showing up, for the days it doesn't feel like it. */
export default function Week() {
  const c = useColors();
  const { counts } = useEntries();
  const { entries, error } = useRecentEntries();
  const recap = entries ? weekRecap(entries, counts) : null;

  return (
    <DetailScreen title="Your last 7 days">
      <Card bg={c.grid[3]} style={{ gap: 6 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: c.onGreen, letterSpacing: -0.5 }}>
          {recap ? (recap.total > 0 ? 'You did more than it feels like.' : 'A fresh week.') : 'Looking back…'}
        </Text>
        {recap?.lines.map((l) => (
          <Body key={l} style={{ color: c.onGreen, fontFamily: fonts.bodySemi }}>
            {l}
          </Body>
        ))}
      </Card>
      {error && <Body style={{ color: c.tang, fontSize: 13 }}>{error}</Body>}

      {recap?.days.map((d) => (
        <View key={d.key} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4 }}>
            <Eyebrow style={{ color: c.ink2 }}>{d.label}</Eyebrow>
            {d.entries.length > 0 && <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: c.ink3 }}>{d.entries.length}</Text>}
          </View>
          {d.entries.length === 0 ? (
            <Body style={{ color: c.ink3, fontSize: 14, paddingHorizontal: 4 }}>Rest day.</Body>
          ) : (
            <Card style={{ gap: 8, paddingVertical: 12 }}>
              {d.entries.map((e) => (
                <View key={e.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ paddingTop: 5 }}>
                    <Dot color={categoryColor(e.category)} />
                  </View>
                  <Body style={{ flex: 1 }}>{e.text}</Body>
                </View>
              ))}
            </Card>
          )}
        </View>
      ))}

      <Card style={{ paddingVertical: 4 }}>
        <Row label="Search everything you’ve logged" onPress={() => router.push('/search')} />
      </Card>
    </DetailScreen>
  );
}

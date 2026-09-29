import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DetailScreen } from '@/components/Screen';
import { Body, Card, Dot, Eyebrow, Mono } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { useSquads } from '@/hooks/squads';
import { categoryColor } from '@/lib/categories';
import { ago } from '@/lib/format';
import { fonts, radius, useColors } from '@/theme/tokens';

/** Everything you logged today, with remove, plus who sent you kudos. */
export default function Day() {
  const c = useColors();
  const { today, remove } = useEntries();
  const { received } = useSquads();
  const [err, setErr] = useState<string | null>(null);

  return (
    <DetailScreen title="Today">
      <Card style={{ gap: 8 }}>
        <Eyebrow>Logged today · {today.length}</Eyebrow>
        {today.length === 0 ? (
          <Body style={{ color: c.ink3, paddingVertical: 6 }}>Nothing yet. Log one small win to light up today’s square.</Body>
        ) : (
          today.map((e) => (
            <View
              key={e.id}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.screen, borderWidth: 2, borderColor: c.soft, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12 }}
            >
              <Dot color={categoryColor(e.category)} />
              <Body style={{ flex: 1, fontFamily: fonts.bodyMedium }}>{e.text}</Body>
              <Mono style={{ fontSize: 12, color: c.ink3 }}>{ago(e.created_at)}</Mono>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${e.text}`}
                hitSlop={8}
                disabled={e.id.startsWith('temp-')}
                onPress={() => remove(e.id).catch(() => setErr('Couldn’t remove that. Try again.'))}
              >
                <Text style={{ fontSize: 18, color: c.ink3, paddingHorizontal: 4 }}>×</Text>
              </Pressable>
            </View>
          ))
        )}
        {err && <Body style={{ color: c.tang, fontSize: 13 }}>{err}</Body>}
      </Card>

      <Card style={{ gap: 8 }}>
        <Eyebrow>Kudos today</Eyebrow>
        {received.length === 0 ? (
          <Body style={{ color: c.ink3 }}>No kudos yet. Squadmates can send them from the Squad tab.</Body>
        ) : (
          received.map((k, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>{k.emoji}</Text>
              <Body style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold }}>{k.name}</Text> cheered you on
              </Body>
              <Text style={{ fontSize: 16 }}>{k.avatar}</Text>
            </View>
          ))
        )}
      </Card>
    </DetailScreen>
  );
}

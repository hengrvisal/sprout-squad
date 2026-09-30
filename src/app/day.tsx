import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DetailScreen } from '@/components/Screen';
import { WinSticker } from '@/components/WinSticker';
import { Body, Card, Eyebrow, Mono } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { useSquads } from '@/hooks/squads';
import { ago } from '@/lib/format';
import { fonts, useColors } from '@/theme/tokens';

/** Everything you logged today, with remove, plus who sent you kudos. */
export default function Day() {
  const c = useColors();
  const { today, remove } = useEntries();
  const { received, notes } = useSquads();
  const [err, setErr] = useState<string | null>(null);

  return (
    <DetailScreen title="Today">
      <Card style={{ gap: 10 }}>
        <Eyebrow>Logged today · {today.length}</Eyebrow>
        {today.length === 0 ? (
          <Body style={{ color: c.ink3, paddingVertical: 6 }}>Nothing yet. Log one small win to light up today’s square.</Body>
        ) : (
          today.map((e, i) => (
            <WinSticker
              key={e.id}
              text={e.text}
              category={e.category}
              i={i}
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Mono style={{ fontSize: 11.5, color: '#131B33', opacity: 0.7 }}>{ago(e.created_at)}</Mono>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${e.text}`}
                    hitSlop={8}
                    disabled={e.id.startsWith('temp-')}
                    onPress={() => remove(e.id).catch(() => setErr('Couldn’t remove that. Try again.'))}
                  >
                    <Text style={{ fontSize: 18, color: '#131B33', paddingHorizontal: 2 }}>×</Text>
                  </Pressable>
                </View>
              }
            />
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

      {notes.length > 0 && (
        <Card style={{ gap: 10 }}>
          <Eyebrow>Notes from your squad</Eyebrow>
          {notes.map((n) => (
            <View key={n.from} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>{n.avatar}</Text>
              <Body style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold }}>{n.name}</Text>
                {'\n'}
                <Text style={{ color: c.ink2 }}>“{n.note}”</Text>
              </Body>
              <Mono style={{ fontSize: 12, color: c.ink3 }}>{ago(n.at)}</Mono>
            </View>
          ))}
        </Card>
      )}
    </DetailScreen>
  );
}

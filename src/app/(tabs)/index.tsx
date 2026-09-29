import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { MonthGrid, MonthHeader, MonthSummary } from '@/components/MonthGrid';
import { Screen } from '@/components/Screen';
import { Body, Button, Card, Chip, Chunky, Dot, Eyebrow, H, Mono } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { CATEGORIES, CategoryKey, categoryColor } from '@/lib/categories';
import { monthAt, streak, weekTotal } from '@/lib/dates';
import { border, fonts, radius, useColors } from '@/theme/tokens';

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export default function Today() {
  const c = useColors();
  const { counts, today, add, remove, ensureMonth, error } = useEntries();
  const [text, setText] = useState('');
  const [cat, setCat] = useState<CategoryKey>('study');
  const [offset, setOffset] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { y, m } = monthAt(offset);

  async function onLog() {
    const t = text.trim().slice(0, 90);
    if (!t) return;
    setText('');
    setSaveError(null);
    try {
      await add(t, cat);
    } catch {
      setText(t);
      setSaveError('Couldn’t save that. Check your connection and try again.');
    }
  }

  function onMonth(o: number) {
    setOffset(o);
    const mm = monthAt(o);
    ensureMonth(mm.y, mm.m);
  }

  return (
    <Screen>
      {error && <Body style={{ color: c.tang }}>{error}</Body>}

      <Chunky bg={c.tang} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, gap: 12 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 42, color: c.tangInk, letterSpacing: -1.5 }}>
          {today.length}
        </Text>
        <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 17, color: c.tangInk }}>
          {today.length === 1 ? 'thing done' : 'things done'}
          {'\n'}today
        </Text>
        <Stat label="Streak" value={`${streak(counts)}d`} />
        <Stat label="Week" value={String(weekTotal(counts))} />
      </Chunky>

      <Card>
        <MonthHeader y={y} m={m} offset={offset} onChange={onMonth} />
        <MonthGrid y={y} m={m} counts={counts} />
        <MonthSummary counts={counts} y={y} m={m} />
      </Card>
      <Card>
        <H>What did you get done?</H>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            value={text}
            onChangeText={setText}
            maxLength={90}
            placeholder="e.g. Finished assignment draft"
            placeholderTextColor={c.ink3}
            returnKeyType="done"
            onSubmitEditing={onLog}
            accessibilityLabel="What you got done"
            style={{
              flex: 1,
              minWidth: 0,
              backgroundColor: c.screen,
              borderWidth: border,
              borderColor: c.line,
              borderRadius: radius.md,
              paddingVertical: 11,
              paddingHorizontal: 12,
              fontFamily: fonts.body,
              fontSize: 15,
              color: c.ink,
            }}
          />
          <Button label="Log" onPress={onLog} disabled={!text.trim()} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIES.map((k) => (
            <Chip key={k.key} label={k.label} dot={k.color} selected={cat === k.key} onPress={() => setCat(k.key)} />
          ))}
        </View>
        {saveError && <Body style={{ color: c.tang, fontSize: 14 }}>{saveError}</Body>}
      </Card>

      <Card>
        <H>Logged today</H>
        {today.length === 0 ? (
          <Body style={{ color: c.ink3, textAlign: 'center', paddingVertical: 8 }}>
            Nothing yet. Log one small win to light up today’s square.
          </Body>
        ) : (
          <View style={{ gap: 8 }}>
            {today.map((e) => (
              <View
                key={e.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: c.screen,
                  borderWidth: 2,
                  borderColor: c.soft,
                  borderRadius: radius.md,
                  paddingVertical: 9,
                  paddingHorizontal: 10,
                }}
              >
                <Dot color={categoryColor(e.category)} />
                <Body style={{ flex: 1, fontFamily: fonts.bodyMedium }}>{e.text}</Body>
                <Mono style={{ fontSize: 12, color: c.ink3 }}>{ago(e.created_at)}</Mono>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${e.text}`}
                  hitSlop={8}
                  disabled={e.id.startsWith('temp-')}
                  onPress={() => remove(e.id).catch(() => setSaveError('Couldn’t remove that. Try again.'))}
                >
                  <Text style={{ fontSize: 18, color: c.ink3, paddingHorizontal: 4 }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </Card>

    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Eyebrow style={{ color: c.tangInk, opacity: 0.7, fontSize: 10 }}>{label}</Eyebrow>
      <Mono style={{ fontSize: 20, color: c.tangInk }}>{value}</Mono>
    </View>
  );
}

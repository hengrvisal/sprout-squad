import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { MonthGrid } from '@/components/MonthGrid';
import { Screen } from '@/components/Screen';
import { Body, Button, Card, Chip, Dot, Eyebrow, Mono, TapCard } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { useSquads } from '@/hooks/squads';
import { CATEGORIES, CategoryKey } from '@/lib/categories';
import { MONTHS, monthAt, streak } from '@/lib/dates';
import { dayLabels } from '@/lib/format';
import { tally } from '@/lib/kudos';
import { border, fonts, radius, useColors } from '@/theme/tokens';

/**
 * Today: log a win, see today at a glance, see the month. Everything else is one tap away:
 * the full list (/day) and month history (/month).
 */
export default function Today() {
  const c = useColors();
  const { counts, today, add, error } = useEntries();
  const { received, refresh: refreshSquads } = useSquads();
  const [text, setText] = useState('');
  const [cat, setCat] = useState<CategoryKey>('study');
  const [picking, setPicking] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { weekday, date } = dayLabels();
  const { y, m } = monthAt(0);
  const st = streak(counts);
  const current = CATEGORIES.find((k) => k.key === cat) ?? CATEGORIES[0];

  // pick up kudos friends sent while you were away
  useFocusEffect(
    useCallback(() => {
      refreshSquads();
    }, [refreshSquads]),
  );

  async function onLog() {
    const t = text.trim().slice(0, 90);
    if (!t) return;
    setText('');
    setSaveError(null);
    setPicking(false);
    try {
      await add(t, cat);
    } catch {
      setText(t);
      setSaveError('Couldn’t save that. Check your connection and try again.');
    }
  }

  return (
    <Screen subtitle={date} title={weekday}>
      {error && <Body style={{ color: c.tang, fontSize: 13 }}>{error}</Body>}

      {/* 1. log a win */}
      <Card style={{ gap: 10 }}>
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: c.ink }}>What did you get done?</Text>
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
        {picking ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map((k) => (
              <Chip key={k.key} label={k.label} dot={k.color} selected={cat === k.key} onPress={() => { setCat(k.key); setPicking(false); }} />
            ))}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Category: ${current.label}. Tap to change`}
            onPress={() => setPicking(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
          >
            <Dot color={current.color} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink2 }}>{current.label}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.ink3 }}>· change</Text>
          </Pressable>
        )}
        {saveError && <Body style={{ color: c.tang, fontSize: 13 }}>{saveError}</Body>}
      </Card>

      {/* 2. today at a glance */}
      <TapCard label="Open today’s list" onPress={() => router.push('/day')} style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 44, lineHeight: 46, color: c.ink, letterSpacing: -1.5 }}>{today.length}</Text>
          <View style={{ flex: 1, paddingRight: 18 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.ink }}>{today.length === 1 ? 'thing done today' : 'things done today'}</Text>
            <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 13.5, color: c.ink3 }}>
              {today[0] ? `Latest: ${today[0].text}` : 'Log one small win to light up today'}
            </Text>
          </View>
        </View>
        {received.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {tally(received).map(([e, n]) => (
              <Text key={e} style={{ fontSize: 14 }}>
                {e}
                <Mono style={{ fontSize: 12, color: c.ink2 }}> {n}</Mono>
              </Text>
            ))}
            <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: c.ink3 }}>kudos today</Text>
          </View>
        )}
      </TapCard>

      {/* 3. the month */}
      <TapCard label="Open month history" onPress={() => router.push('/month')} style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingRight: 18 }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: c.ink }}>{MONTHS[m]}</Text>
          <Eyebrow>{st > 0 ? `🔥 ${st}-day streak` : 'Start a streak today'}</Eyebrow>
        </View>
        <MonthGrid y={y} m={m} counts={counts} mini gap={5} />
      </TapCard>
    </Screen>
  );
}

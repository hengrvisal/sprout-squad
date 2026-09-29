import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { MonthGrid } from '@/components/MonthGrid';
import { Screen } from '@/components/Screen';
import { Body, Button, Card, Chip, Dot, Eyebrow, Mono, TapCard } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { useSquads } from '@/hooks/squads';
import { CATEGORIES, CategoryKey } from '@/lib/categories';
import { MONTHS, monthAt, streak, weekTotal } from '@/lib/dates';
import { dayLabels } from '@/lib/format';
import { tally } from '@/lib/kudos';
import { planProgress, sortPlans } from '@/lib/plans';
import { border, fonts, radius, useColors } from '@/theme/tokens';

/**
 * Today: log a win, see today at a glance, see the month. Everything else is one tap away:
 * the full list (/day) and month history (/month).
 */
export default function Today() {
  const c = useColors();
  const { counts, today, add, error, plans, completePlan } = useEntries();
  const { received, notes, refresh: refreshSquads } = useSquads();
  const [text, setText] = useState('');
  const [cat, setCat] = useState<CategoryKey>('study');
  const [picking, setPicking] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { weekday, date } = dayLabels();
  const { y, m } = monthAt(0);
  const st = streak(counts);
  const current = CATEGORIES.find((k) => k.key === cat) ?? CATEGORIES[0];
  const planned = planProgress(plans);
  const latestNote = notes[0];
  const week = weekTotal(counts);

  async function onTick(id: string) {
    setSaveError(null);
    try {
      await completePlan(id, cat);
    } catch {
      setSaveError('Couldn’t log that. Check your connection and try again.');
    }
  }

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

        {/* today's plan: tap an item to log it as a win */}
        <View style={{ borderTopWidth: 1.5, borderTopColor: c.soft, paddingTop: 10, gap: 6 }}>
          {plans.length === 0 ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/plan')} hitSlop={6} style={{ alignSelf: 'flex-start' }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink3 }}>＋ Plan your day (optional)</Text>
            </Pressable>
          ) : (
            <>
              <Pressable accessibilityRole="button" accessibilityLabel="Edit today’s plan" onPress={() => router.push('/plan')} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Eyebrow>
                  Plan · {planned.done}/{planned.total}
                </Eyebrow>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: c.ink3 }}>Edit ›</Text>
              </Pressable>
              {sortPlans(plans).map((p) => {
                const done = !!p.entry_id;
                return (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityState={{ checked: done, disabled: done }}
                    accessibilityLabel={done ? `${p.text}, done` : `Log ${p.text}`}
                    disabled={done}
                    onPress={() => onTick(p.id)}
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.6 : 1 })}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: c.line,
                        backgroundColor: done ? c.grid[3] : c.card,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {done && <Text style={{ fontSize: 11, color: c.onGreen, fontFamily: fonts.bodyBold }}>✓</Text>}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontFamily: fonts.bodyMedium,
                        fontSize: 14.5,
                        color: done ? c.ink3 : c.ink,
                        textDecorationLine: done ? 'line-through' : 'none',
                      }}
                    >
                      {p.text}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
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
        {today.length === 0 && week > 0 && (
          <Pressable accessibilityRole="button" onPress={() => router.push('/week')} hitSlop={6} style={{ alignSelf: 'flex-start' }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink2 }}>
              Quiet day? You’ve done {week} {week === 1 ? 'thing' : 'things'} this week. <Text style={{ color: c.ink }}>See them ›</Text>
            </Text>
          </Pressable>
        )}
        {latestNote && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingRight: 18 }}>
            <Text style={{ fontSize: 15 }}>{latestNote.avatar}</Text>
            <Text numberOfLines={2} style={{ flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: c.ink2 }}>
              <Text style={{ fontFamily: fonts.bodyBold, color: c.ink }}>{latestNote.name}:</Text> “{latestNote.note}”
              {notes.length > 1 ? <Text style={{ color: c.ink3 }}> +{notes.length - 1} more</Text> : null}
            </Text>
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

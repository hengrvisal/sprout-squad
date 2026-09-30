import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useCelebrate } from '@/components/Celebrate';
import { CategoryPicker } from '@/components/CategoryPicker';
import { MonthGrid } from '@/components/MonthGrid';
import { Screen } from '@/components/Screen';
import { WinSticker } from '@/components/WinSticker';
import { Body, Button, Card, Chunky, Eyebrow, Mono, TapCard } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { useNotifications } from '@/hooks/notifications';
import { useProfile } from '@/hooks/profile';
import { useSquads } from '@/hooks/squads';
import { CATEGORIES, categoryEmoji, CategoryKey } from '@/lib/categories';
import { dailyPrompt, example, greeting, winMessage } from '@/lib/cheer';
import { MONTHS, monthAt, monthStats, streak, weekTotal, ymd } from '@/lib/dates';
import { dayLabels } from '@/lib/format';
import { tally } from '@/lib/kudos';
import { planProgress, sortPlans } from '@/lib/plans';
import { border, fonts, radius, useColors } from '@/theme/tokens';

const SHOW_WINS = 4;
const INK = '#131B33'; // text on the bright category colours, same in light and dark

/**
 * Today: log a win (and feel good about it), see today's wins, see the month filling in.
 * The full list (/day) and month history (/month) are one tap away.
 */
export default function Today() {
  const c = useColors();
  const celebrate = useCelebrate();
  const { profile } = useProfile();
  const { counts, today, add, error, plans, completePlan } = useEntries();
  const { received, notes, refresh: refreshSquads } = useSquads();
  const { showPrompt, enable, dismissPrompt } = useNotifications();
  const [text, setText] = useState('');
  const [cat, setCat] = useState<CategoryKey>('study');
  const [focused, setFocused] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { date } = dayLabels();
  const { y, m } = monthAt(0);
  const st = streak(counts);
  const current = CATEGORIES.find((k) => k.key === cat) ?? CATEGORIES[0];
  const planned = planProgress(plans);
  const latestNote = notes[0];
  const week = weekTotal(counts);
  const month = monthStats(counts, y, m);
  const firstName = profile?.display_name?.split(' ')[0];

  // pick up kudos friends sent while you were away
  useFocusEffect(
    useCallback(() => {
      refreshSquads();
    }, [refreshSquads]),
  );

  function cheer(category: CategoryKey) {
    const n = today.length + 1;
    const key = ymd(new Date());
    const msg = winMessage(n, streak({ ...counts, [key]: Math.max(1, counts[key] ?? 0) }));
    celebrate({ ...msg, emoji: [categoryEmoji(category), '✨', '🌱', '💚', '⭐'] });
  }

  async function onLog() {
    const t = text.trim().slice(0, 90);
    if (!t) return;
    setText('');
    setSaveError(null);
    cheer(cat);
    try {
      await add(t, cat);
    } catch {
      setText(t);
      setSaveError('Couldn’t save that. Check your connection and try again.');
    }
  }

  async function onTick(id: string) {
    setSaveError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    cheer(cat);
    try {
      await completePlan(id, cat);
    } catch {
      setSaveError('Couldn’t log that. Check your connection and try again.');
    }
  }

  return (
    <Screen
      subtitle={date}
      title={firstName ? `${greeting()}, ${firstName}` : greeting()}
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={st ? `${st}-day streak. Open month` : 'No streak yet. Open month'}
          onPress={() => router.push('/month')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderWidth: 2,
            borderColor: c.line,
            borderRadius: radius.pill,
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: st ? c.tang : c.card,
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 15, opacity: st ? 1 : 0.5 }}>🔥</Text>
          <Text style={{ fontFamily: fonts.mono, fontSize: 15, color: st ? INK : c.ink3 }}>{st}</Text>
        </Pressable>
      }
    >
      {error && <Body style={{ color: c.tang, fontSize: 13 }}>{error}</Body>}

      {/* 1. log a win: the star of the page */}
      <Chunky style={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 25, lineHeight: 29, color: c.ink, letterSpacing: -0.5 }}>{dailyPrompt()}</Text>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: c.line,
              backgroundColor: current.color,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: '6deg' }],
            }}
          >
            <Text style={{ fontSize: 26 }}>{current.emoji}</Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: c.screen,
            borderWidth: border,
            borderColor: focused ? current.color : c.line,
            borderRadius: radius.md,
            paddingLeft: 12,
            paddingRight: 5,
            paddingVertical: 5,
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={90}
            placeholder={`e.g. ${example(cat, today.length)}`}
            placeholderTextColor={c.ink3}
            returnKeyType="done"
            onSubmitEditing={onLog}
            accessibilityLabel="What you got done"
            style={{ flex: 1, minWidth: 0, paddingVertical: 8, fontFamily: fonts.bodyMedium, fontSize: 16, color: c.ink }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log it"
            disabled={!text.trim()}
            onPress={onLog}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 11,
              borderWidth: 2,
              borderColor: c.line,
              backgroundColor: text.trim() ? c.grid[3] : c.soft,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontFamily: fonts.display, fontSize: 15, color: text.trim() ? c.onGreen : c.ink3 }}>Log it</Text>
          </Pressable>
        </View>

        <CategoryPicker value={cat} onChange={setCat} />
        {saveError && <Body style={{ color: c.tang, fontSize: 13 }}>{saveError}</Body>}

        {/* today's plan: tap an item to log it as a win */}
        <View style={{ borderTopWidth: 1.5, borderTopColor: c.soft, paddingTop: 12, gap: 8 }}>
          {plans.length === 0 ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/plan')} hitSlop={6} style={{ alignSelf: 'flex-start' }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13.5, color: c.ink3 }}>＋ Plan up to 3 things for today</Text>
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
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: c.line,
                        backgroundColor: done ? c.grid[3] : c.card,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {done && <Text style={{ fontSize: 13, color: c.onGreen, fontFamily: fonts.bodyBold }}>✓</Text>}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: done ? c.ink3 : c.ink, textDecorationLine: done ? 'line-through' : 'none' }}
                    >
                      {p.text}
                    </Text>
                    {!done && <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: c.ink3 }}>tap when done</Text>}
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
      </Chunky>

      {/* 2. today's wins */}
      <TapCard label="Open today’s list" onPress={() => router.push('/day')} style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingRight: 18 }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: c.ink }}>Today’s wins</Text>
          {today.length > 0 && (
            <View style={{ backgroundColor: c.grid[3], borderRadius: radius.pill, borderWidth: 2, borderColor: c.line, paddingHorizontal: 8 }}>
              <Mono style={{ fontSize: 13, color: c.onGreen }}>{today.length}</Mono>
            </View>
          )}
        </View>
        {today.length === 0 ? (
          <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: c.ink3, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 2.5, borderColor: c.tang, backgroundColor: c.grid[0] }} />
            <Text style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, color: c.ink2 }}>
              Your first win turns today’s square green. Even small stuff counts ✨
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {today.slice(0, SHOW_WINS).map((e, i) => (
              <WinSticker key={e.id} text={e.text} category={e.category} i={i} />
            ))}
            {today.length > SHOW_WINS && (
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink3 }}>+{today.length - SHOW_WINS} more</Text>
            )}
          </View>
        )}
        {received.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {tally(received).map(([e, n]) => (
              <View key={e} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.lilac, borderRadius: radius.pill, borderWidth: 2, borderColor: c.line, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 14 }}>{e}</Text>
                <Mono style={{ fontSize: 12, color: INK }}>{n}</Mono>
              </View>
            ))}
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.ink2 }}>kudos from your squad</Text>
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

      {showPrompt && (
        <Card bg={c.lilac} style={{ gap: 10 }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 17, color: c.tangInk }}>Nice one. Want a heads-up when your squad cheers you on?</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Button label="Turn on" onPress={() => enable().finally(dismissPrompt)} />
            <Pressable accessibilityRole="button" onPress={dismissPrompt} hitSlop={8}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.tangInk }}>Not now</Text>
            </Pressable>
          </View>
        </Card>
      )}

      {/* 3. the month */}
      <TapCard label="Open month history" onPress={() => router.push('/month')} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, paddingRight: 22 }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: c.ink }}>{MONTHS[m]}</Text>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink2 }}>
            <Mono style={{ fontSize: 13, color: c.ink }}>{month.greenDays}</Mono> green {month.greenDays === 1 ? 'day' : 'days'}
          </Text>
        </View>
        <MonthGrid y={y} m={m} counts={counts} mini gap={6} />
      </TapCard>
    </Screen>
  );
}

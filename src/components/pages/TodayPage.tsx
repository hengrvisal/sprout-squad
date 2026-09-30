import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useCelebrate } from '@/components/Celebrate';
import { CategoryPicker } from '@/components/CategoryPicker';
import { Screen } from '@/components/Screen';
import { StreakSheet } from '@/components/StreakSheet';
import { Button, Chunky } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { useNotifications } from '@/hooks/notifications';
import { useSquads } from '@/hooks/squads';
import { CATEGORIES, categoryColor, categoryEmoji, CategoryKey } from '@/lib/categories';
import { dailyPrompt, example, winMessage } from '@/lib/cheer';
import { streak, ymd } from '@/lib/dates';
import { tally } from '@/lib/kudos';
import { sortPlans } from '@/lib/plans';
import { fonts, radius, softShadow, useColors } from '@/theme/tokens';

const SHOW = 5;

/** One line in today's list: a win (filled) or a planned thing still to do (hollow, tap to log). */
function Line({ emoji, color, text, done, onPress, i }: { emoji: string; color: string; text: string; done: boolean; onPress?: () => void; i: number }) {
  const c = useColors();
  const [pop] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10, delay: Math.min(i, 6) * 35 }).start();
  }, [pop, i]);
  return (
    <Animated.View style={{ opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={done ? `${text}, done` : `Log ${text}`}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, opacity: pressed ? 0.6 : 1 })}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: done ? color : 'transparent',
            borderWidth: done ? 0 : 1.5,
            borderColor: c.ink3,
            borderStyle: done ? 'solid' : 'dashed',
          }}
        >
          <Text style={{ fontSize: 16, opacity: done ? 1 : 0.5 }}>{emoji}</Text>
        </View>
        <Text numberOfLines={1} style={{ flex: 1, fontFamily: done ? fonts.bodySemi : fonts.bodyMedium, fontSize: 16, color: done ? c.ink : c.ink2 }}>
          {text}
        </Text>
        {!done && <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.ink3 }}>tap when done</Text>}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Today does one thing: log what you got done. Your wins (and anything you planned)
 * collect underneath. The month, focus timer, squad and settings each have their own page.
 */
export function TodayPage({ active }: { active: boolean }) {
  const c = useColors();
  const celebrate = useCelebrate();
  const { counts, today, add, error, plans, completePlan } = useEntries();
  const { received, refresh: refreshSquads } = useSquads();
  const { showPrompt, enable, dismissPrompt } = useNotifications();
  const [text, setText] = useState('');
  const [cat, setCat] = useState<CategoryKey>('study');
  const [saveError, setSaveError] = useState<string | null>(null);
  const st = streak(counts);
  const open = sortPlans(plans).filter((p) => !p.entry_id);
  const kudos = tally(received);
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  const [streakOpen, setStreakOpen] = useState(false);
  const current = CATEGORIES.find((k) => k.key === cat) ?? CATEGORIES[0];

  // pick up kudos friends sent while you were away
  useEffect(() => {
    if (active) refreshSquads();
  }, [active, refreshSquads]);

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

  const ready = !!text.trim();

  return (
    <Screen
      gradient="today"
      subtitle={date}
      title="Today"
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${st}-day streak. Open`}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setStreakOpen(true);
          }}
          hitSlop={8}
          style={({ pressed }) => [
            { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.glassStrong, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 8, transform: [{ scale: pressed ? 0.94 : 1 }] },
            softShadow(c),
          ]}
        >
          <Text style={{ fontSize: 15, opacity: st ? 1 : 0.4 }}>🔥</Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: st ? c.ink : c.ink3 }}>{st}</Text>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.ink3 }}>{st === 1 ? 'day' : 'days'}</Text>
        </Pressable>
      }
    >
      {/* the one main thing */}
      <View style={{ gap: 18, marginTop: 8 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: c.accent, marginBottom: -12 }}>
          ✍️ Log a win
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: c.ink, letterSpacing: -1 }}>{dailyPrompt()}</Text>

        <View
          style={[
            { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.glassStrong, borderRadius: radius.pill, paddingLeft: 20, paddingRight: 6, paddingVertical: 6 },
            softShadow(c),
          ]}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            maxLength={90}
            placeholder={example(cat, today.length)}
            placeholderTextColor={c.ink3}
            returnKeyType="done"
            onSubmitEditing={onLog}
            accessibilityLabel="What you got done"
            style={{ flex: 1, minWidth: 0, paddingVertical: 10, fontFamily: fonts.bodyMedium, fontSize: 17, color: c.ink }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log it"
            disabled={!ready}
            onPress={onLog}
            style={({ pressed }) => ({
              width: 46,
              height: 46,
              borderRadius: 23,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: ready ? c.accent : c.soft,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={ready ? '#FFFFFF' : c.ink3} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <CategoryPicker compact value={cat} onChange={setCat} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.ink3, textAlign: 'center' }}>
            Logging as <Text style={{ fontFamily: fonts.bodyBold, color: c.ink2 }}>{current.label}</Text> · tap an emoji to change
          </Text>
        </View>
        {(saveError || error) && <Text style={{ fontFamily: fonts.bodySemi, color: c.tang, fontSize: 13 }}>{saveError ?? error}</Text>}
      </View>

      {/* what's done (and what's planned) */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: -10, paddingHorizontal: 4 }}>
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 19, color: c.ink }}>
          Done today{today.length ? <Text style={{ color: c.accent }}> · {today.length}</Text> : null}
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12.5, color: c.ink3 }}>
          {today.length === 0 ? 'nothing yet' : today.length === 1 ? 'today is green 🌱' : 'keep stacking'}
        </Text>
      </View>
      <Chunky style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        {today.length === 0 && open.length === 0 ? (
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: c.ink3, paddingVertical: 12, textAlign: 'center' }}>
            Your first win turns today’s square green ✨
          </Text>
        ) : (
          <>
            {today.slice(0, SHOW).map((e, i) => (
              <Line key={e.id} i={i} done emoji={categoryEmoji(e.category)} color={categoryColor(e.category)} text={e.text} />
            ))}
            {open.length > 0 && (
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 0.8, textTransform: 'uppercase', color: c.ink3, marginTop: today.length ? 8 : 4 }}>
                Still planned
              </Text>
            )}
            {open.map((p, i) => (
              <Line key={p.id} i={today.length + i} done={false} emoji="" color={c.soft} text={p.text} onPress={() => onTick(p.id)} />
            ))}
          </>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/plan')} hitSlop={8}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13.5, color: c.ink3 }}>{plans.length ? 'Edit plan' : '＋ Plan your day'}</Text>
          </Pressable>
          {today.length > 0 && (
            <Pressable accessibilityRole="button" onPress={() => router.push('/day')} hitSlop={8}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13.5, color: c.ink3 }}>
                {today.length > SHOW ? `All ${today.length} ›` : 'Edit ›'}
              </Text>
            </Pressable>
          )}
        </View>
      </Chunky>

      {kudos.length > 0 && (
        <Pressable accessibilityRole="button" onPress={() => router.push('/day')} style={{ alignSelf: 'center' }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.ink2 }}>
            {kudos.map(([e, n]) => `${e}${n > 1 ? ` ${n}` : ''}`).join('  ')}
            <Text style={{ color: c.ink3 }}>  from your squad</Text>
          </Text>
        </Pressable>
      )}

      <StreakSheet open={streakOpen} onClose={() => setStreakOpen(false)} counts={counts} />

      {showPrompt && (
        <Chunky style={{ padding: 18, gap: 12 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: c.ink }}>Get a nudge when your squad cheers you on?</Text>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Button label="Turn on" onPress={() => enable().finally(dismissPrompt)} />
            <Pressable accessibilityRole="button" onPress={dismissPrompt} hitSlop={8}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.ink3 }}>Not now</Text>
            </Pressable>
          </View>
        </Chunky>
      )}
    </Screen>
  );
}

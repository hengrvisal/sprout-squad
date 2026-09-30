import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useCelebrate } from '@/components/Celebrate';
import { CategoryPicker } from '@/components/CategoryPicker';
import { Screen } from '@/components/Screen';
import { Body, Button, Card, Chunky, Divider, Row } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { useEntries } from '@/hooks/entries';
import { useFocus } from '@/hooks/focus';
import { useSessions } from '@/hooks/sessions';
import { useSquads } from '@/hooks/squads';
import { categoryEmoji } from '@/lib/categories';
import { streak } from '@/lib/dates';
import { clock, Mode, MODE_LABEL, minutesLabel, progress } from '@/lib/pomodoro';
import { leftLabel, namesLabel, secondsLeft as sessionLeft } from '@/lib/sessions';
import { border, fonts, radius, useColors } from '@/theme/tokens';

const MODES: Mode[] = ['focus', 'short', 'long'];
const SHORT: Record<Mode, string> = { focus: 'Focus', short: 'Short break', long: 'Long break' };

/** The big ring: track, progress arc in the mode colour, time in the middle. */
function Ring({ value, color, size, children }: { value: number; color: string; size: number; children: React.ReactNode }) {
  const c = useColors();
  const stroke = 18;
  const r = (size - stroke) / 2 - 4;
  const len = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* hard shadow + ink rims, in the app's chunky style */}
        <Circle cx={size / 2 + 3} cy={size / 2 + 3} r={r + stroke / 2 + 1} fill={c.line} />
        <Circle cx={size / 2} cy={size / 2} r={r + stroke / 2 + 1} fill={c.card} stroke={c.line} strokeWidth={border} />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.soft} strokeWidth={stroke} fill="none" />
        {v > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${len} ${len}`}
            strokeDashoffset={len * (1 - v)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
        <Circle cx={size / 2} cy={size / 2} r={r - stroke / 2 - 1} fill="none" stroke={c.line} strokeWidth={2} />
      </Svg>
      {children}
    </View>
  );
}

function RoundButton({ label, icon, onPress, big, bg }: { label: string; icon: string; onPress: () => void; big?: boolean; bg: string }) {
  const c = useColors();
  const s = big ? 84 : 54;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}>
      {({ pressed }) => (
        <View style={{ width: s + 4, height: s + 4 }}>
          {!pressed && <View style={{ position: 'absolute', left: 4, top: 4, width: s, height: s, borderRadius: s / 2, backgroundColor: c.line }} />}
          <View
            style={{
              width: s,
              height: s,
              borderRadius: s / 2,
              backgroundColor: bg,
              borderWidth: border,
              borderColor: c.line,
              alignItems: 'center',
              justifyContent: 'center',
              transform: pressed ? [{ translateX: 4 }, { translateY: 4 }] : [],
            }}
          >
            <Text style={{ fontFamily: fonts.display, fontSize: big ? 30 : 20, color: bg === c.card ? c.ink : '#131B33' }}>{icon}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** Focus: a pomodoro timer. Finish a round and it offers to log what you did as a win. */
export default function FocusTab() {
  const c = useColors();
  const f = useFocus();
  const celebrate = useCelebrate();
  const { add, today, counts } = useEntries();
  const { selected } = useSquads();
  const { live, joined } = useSessions();
  const { session } = useAuth();
  const me = session?.user.id;
  const [winText, setWinText] = useState('');
  const [logErr, setLogErr] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const running = f.timer.status === 'running';

  const modeColor: Record<Mode, string> = { focus: c.tang, short: c.sky, long: c.lilac };
  const color = modeColor[f.timer.mode];

  // keep the screen on while a round is running and you're looking at it
  useFocusEffect(
    useCallback(() => {
      setVisible(true);
      return () => setVisible(false);
    }, []),
  );
  useEffect(() => {
    if (!(running && visible)) return;
    activateKeepAwakeAsync('focus').catch(() => {});
    return () => {
      deactivateKeepAwake('focus').catch(() => {});
    };
  }, [running, visible]);

  // a finished round: prefill the win with what you were working on
  const finishedAt = f.finished?.at;
  const finishedTask = f.finished?.task;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill once per finished round
    if (finishedAt) setWinText(finishedTask ?? '');
  }, [finishedAt, finishedTask]);

  async function logWin() {
    const t = winText.trim().slice(0, 90);
    if (!t || !f.finished) return;
    setLogErr(null);
    const cat = f.finished.category;
    try {
      await add(t, cat);
      f.clearFinished();
      const n = today.length + 1;
      celebrate({
        title: n === 1 ? 'Today’s square is green!' : 'Logged!',
        sub: n === 1 && streak(counts) > 0 ? `${streak(counts) + 1}-day streak going.` : `${n} things done today.`,
        emoji: [categoryEmoji(cat), '🍅', '✨', '🌱'],
      });
    } catch {
      setLogErr('Couldn’t save that. Check your connection and try again.');
    }
  }

  function toggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (running) f.pause();
    else f.start();
  }

  const inSession = live ? live.members.filter((x) => !x.left_at).map((x) => (x.user_id === me ? 'You' : x.name)) : [];
  const roundsInCycle = f.settings.rounds;
  const doneInCycle = f.timer.done % roundsInCycle;

  return (
    <Screen
      title="Focus"
      subtitle={f.stats.rounds ? `Today · ${minutesLabel(f.stats.minutes)} focused` : 'Pomodoro'}
      right={
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 2, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: f.stats.rounds ? c.tang : c.card, marginBottom: 4 }}
          accessibilityLabel={`${f.stats.rounds} focus rounds today`}
        >
          <Text style={{ fontSize: 14 }}>🍅</Text>
          <Text style={{ fontFamily: fonts.mono, fontSize: 14, color: f.stats.rounds ? '#131B33' : c.ink }}>{f.stats.rounds}</Text>
        </View>
      }
    >
      {/* mode switcher */}
      <View style={{ flexDirection: 'row', gap: 6, backgroundColor: c.soft, borderRadius: radius.pill, padding: 4, borderWidth: 2, borderColor: c.line }}>
        {MODES.map((m) => {
          const on = f.timer.mode === m;
          return (
            <Pressable
              key={m}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => {
                if (on) return;
                Haptics.selectionAsync().catch(() => {});
                f.switchMode(m);
              }}
              style={{ flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center', backgroundColor: on ? modeColor[m] : 'transparent', borderWidth: on ? 2 : 0, borderColor: c.line }}
            >
              <Text numberOfLines={1} style={{ fontFamily: on ? fonts.bodyBold : fonts.bodySemi, fontSize: 13, color: on ? '#131B33' : c.ink2 }}>
                {SHORT[m]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* the timer */}
      <View style={{ alignItems: 'center', gap: 18 }}>
        <Ring value={progress(f.timer, f.settings)} color={color} size={270}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: c.ink3 }}>
            {MODE_LABEL[f.timer.mode]}
          </Text>
          <Text
            accessibilityLabel={`${Math.ceil(f.left / 60)} minutes left`}
            style={{ fontFamily: fonts.display, fontSize: 60, lineHeight: 66, color: c.ink, letterSpacing: -2, fontVariant: ['tabular-nums'] }}
          >
            {clock(f.left)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }} accessibilityLabel={`Round ${doneInCycle + 1} of ${roundsInCycle}`}>
            {Array.from({ length: roundsInCycle }, (_, i) => (
              <View
                key={i}
                style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: c.line, backgroundColor: i < doneInCycle ? c.tang : c.soft }}
              />
            ))}
          </View>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: c.ink3, marginTop: 6 }}>
            {f.timer.status === 'paused' ? 'Paused' : running ? (f.timer.mode === 'focus' ? 'Stay with it' : 'Breathe') : 'Ready'}
          </Text>
        </Ring>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 26 }}>
          <RoundButton label="Reset" icon="↺" bg={c.card} onPress={f.reset} />
          <RoundButton label={running ? 'Pause' : 'Start'} icon={running ? '❚❚' : '▶'} big bg={color} onPress={toggle} />
          <RoundButton label="Skip to next" icon="⏭" bg={c.card} onPress={f.skip} />
        </View>
      </View>

      {/* finished a round → log it */}
      {f.finished && (
        <Card bg={c.grid[1]} style={{ gap: 10 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: c.onGreen }}>🍅 {f.finished.minutes} minutes done. What did you get done?</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              value={winText}
              onChangeText={setWinText}
              maxLength={90}
              placeholder="e.g. Drafted the intro"
              placeholderTextColor={c.ink3}
              returnKeyType="done"
              onSubmitEditing={logWin}
              accessibilityLabel="What you got done"
              style={{ flex: 1, minWidth: 0, backgroundColor: '#FFFFFF', borderWidth: border, borderColor: c.line, borderRadius: radius.md, paddingVertical: 11, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 15, color: '#131B33' }}
            />
            <Button label="Log it" onPress={logWin} disabled={!winText.trim()} />
          </View>
          <Pressable onPress={f.clearFinished} hitSlop={6} style={{ alignSelf: 'flex-start' }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.onGreen }}>Not now</Text>
          </Pressable>
          {logErr && <Body style={{ color: c.tang, fontSize: 13 }}>{logErr}</Body>}
        </Card>
      )}

      {/* what you're working on */}
      <Card style={{ gap: 12 }}>
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 17, color: c.ink }}>What are you focusing on?</Text>
        <TextInput
          value={f.task}
          onChangeText={f.setTask}
          maxLength={90}
          placeholder="e.g. Assignment 2, section 3"
          placeholderTextColor={c.ink3}
          accessibilityLabel="What you’re focusing on"
          style={{ backgroundColor: c.screen, borderWidth: border, borderColor: c.line, borderRadius: radius.md, paddingVertical: 11, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 15, color: c.ink }}
        />
        <CategoryPicker compact value={f.category} onChange={f.setCategory} />
      </Card>

      {/* with the squad */}
      {selected &&
        (live ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/session')}>
            {({ pressed }) => (
              <Chunky bg={c.grid[3]} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.6 : 1 }}>
                <Text style={{ fontSize: 24 }}>🌿</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.onGreen }}>
                    {namesLabel(inSession)} {inSession.length === 1 && inSession[0] !== 'You' ? 'is' : 'are'} focusing together
                  </Text>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.onGreen }}>
                    {leftLabel(sessionLeft(live.session))} · {joined ? 'You’re in' : 'Tap to join'}
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.mono, fontSize: 20, color: c.onGreen }}>›</Text>
              </Chunky>
            )}
          </Pressable>
        ) : null)}

      <Card style={{ gap: 0, paddingVertical: 4 }}>
        {selected && !live && (
          <>
            <Row label={`Focus with ${selected.name}`} value="Plant bonus" onPress={() => router.push('/session')} />
            <Divider />
          </>
        )}
        <Row
          label="Timer settings"
          value={`${f.settings.focus} / ${f.settings.short} / ${f.settings.long}`}
          onPress={() => router.push('/focus-settings')}
        />
      </Card>
    </Screen>
  );
}

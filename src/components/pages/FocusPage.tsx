import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useCelebrate } from '@/components/Celebrate';
import { CategoryPicker } from '@/components/CategoryPicker';
import { FocusDial } from '@/components/FocusDial';
import { Icon, IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Chunky } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { useEntries } from '@/hooks/entries';
import { useFocus } from '@/hooks/focus';
import { usePager } from '@/hooks/pager';
import { useSessions } from '@/hooks/sessions';
import { useSquads } from '@/hooks/squads';
import { categoryEmoji } from '@/lib/categories';
import { streak, ymd } from '@/lib/dates';
import { clock, dialMinutes, Mode, MODE_KEY, minutesLabel, progress, sessionName } from '@/lib/pomodoro';
import { namesLabel } from '@/lib/sessions';
import { fonts, radius, softShadow, useColors } from '@/theme/tokens';

const MODE_COLORS: Record<Mode, [string, string]> = {
  focus: ['#E3A57E', '#D9825F'], // terracotta
  short: ['#9CC3CC', '#7FA6B5'], // mist
  long: ['#A9C996', '#7FA87A'], // sage
};

function RoundButton({ icon, label, onPress, big }: { icon: IconName; label: string; onPress: () => void; big?: boolean }) {
  const c = useColors();
  const s = big ? 76 : 52;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        { width: s, height: s, borderRadius: s / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: big ? c.ink : c.glassStrong, opacity: pressed ? 0.7 : 1 },
        big ? softShadow(c, 2) : null,
      ]}
    >
      <Icon name={icon} size={big ? 28 : 20} color={big ? c.screen : c.ink2} />
    </Pressable>
  );
}

/** Focus: just the timer. Turn the dial to set it, tap it to start. A finished round offers to log a win. */
export function FocusPage({ active }: { active: boolean }) {
  const c = useColors();
  const f = useFocus();
  const celebrate = useCelebrate();
  const { width } = useWindowDimensions();
  const { add, today, counts } = useEntries();
  const { live, joined } = useSessions();
  const { selected } = useSquads();
  const { session } = useAuth();
  const me = session?.user.id;
  const [winText, setWinText] = useState('');
  const { setLocked } = usePager();
  const [dragging, setDragging] = useState(false);
  const [logErr, setLogErr] = useState<string | null>(null);
  const running = f.timer.status === 'running';
  const size = Math.min(width - 90, 290);

  // keep the screen on while a round is running and you're looking at it
  const visible = active;
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
    const cat = f.category;
    try {
      await add(t, cat);
      f.clearFinished();
      const key = ymd(new Date());
      const n = today.length + 1;
      celebrate({
        title: n === 1 ? 'Today’s square is green!' : 'Logged!',
        sub: n === 1 ? `${streak({ ...counts, [key]: 1 })}-day streak going.` : `${n} things done today.`,
        emoji: [categoryEmoji(cat), '🍅', '✨', '🌱'],
      });
    } catch {
      setLogErr('Couldn’t save that. Try again.');
    }
  }

  function toggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (running) f.pause();
    else f.start();
  }

  const inSession = live ? live.members.filter((x) => !x.left_at).map((x) => (x.user_id === me ? 'You' : x.name)) : [];
  const doneInCycle = f.timer.done % f.settings.rounds;
  const mode = f.timer.mode;
  const key = MODE_KEY[mode];
  const length = f.settings[key];
  const idle = f.timer.status === 'idle';
  const name = sessionName(mode, length);
  const status = dragging
    ? `${name} · ${minutesLabel(length)}`
    : f.timer.status === 'paused'
      ? 'Paused · tap the dial to resume'
      : running
        ? mode === 'focus'
          ? 'Stay with it · tap to pause'
          : 'Breathe · tap to pause'
        : 'Drag the ring to set · tap to start';

  function onTurn(turns: number) {
    const next = dialMinutes(0, turns, key);
    if (next !== f.settings[key]) {
      Haptics.selectionAsync().catch(() => {});
      f.updateSettings({ [key]: next });
    }
  }

  return (
    <Screen
      gradient={f.timer.mode === 'focus' ? 'focus' : 'rest'}
      title="Focus"
      subtitle={`${name} · ${minutesLabel(length)}`}
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Timer settings"
          onPress={() => router.push('/focus-settings')}
          hitSlop={8}
          style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, backgroundColor: c.glassStrong, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
        >
          <Icon name="gear" size={20} color={c.ink2} />
        </Pressable>
      }
    >
      {live && (
        <Pressable accessibilityRole="button" onPress={() => router.push('/session')} style={{ alignSelf: 'center' }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.ink2, backgroundColor: c.glassStrong, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7, overflow: 'hidden' }}>
            🌿 {namesLabel(inSession)} {inSession.length === 1 && inSession[0] !== 'You' ? 'is' : 'are'} focusing · {joined ? 'You’re in' : 'Join'}
          </Text>
        </Pressable>
      )}

      {f.finished ? (
        /* a round just ended: log it */
        <Chunky style={{ padding: 20, gap: 16, marginTop: 20 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: c.ink, letterSpacing: -0.6 }}>
            🍅 {f.finished.minutes} minutes, done.{'\n'}What did you get done?
          </Text>
          <TextInput
            value={winText}
            onChangeText={setWinText}
            maxLength={90}
            placeholder="e.g. Drafted the intro"
            placeholderTextColor={c.ink3}
            returnKeyType="done"
            onSubmitEditing={logWin}
            accessibilityLabel="What you got done"
            style={{ backgroundColor: c.glassStrong, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 20, fontFamily: fonts.bodyMedium, fontSize: 16, color: c.ink }}
          />
          <CategoryPicker compact value={f.category} onChange={f.setCategory} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <Pressable
              accessibilityRole="button"
              onPress={logWin}
              disabled={!winText.trim()}
              style={({ pressed }) => ({ flex: 1, backgroundColor: c.accent, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', opacity: !winText.trim() ? 0.4 : pressed ? 0.7 : 1 })}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: '#FFFFFF' }}>Log it</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={f.clearFinished} hitSlop={8}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: c.ink3 }}>Skip</Text>
            </Pressable>
          </View>
          {logErr && <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.tang }}>{logErr}</Text>}
        </Chunky>
      ) : (
        /* the timer */
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, paddingTop: 8 }}>
          <FocusDial
            size={size}
            value={idle ? Math.min(1, length / 60) : progress(f.timer, f.settings)}
            colors={MODE_COLORS[mode]}
            editable={idle}
            minutes={length}
            onTurn={onTurn}
            onTap={toggle}
            onDragChange={(d) => {
              setDragging(d);
              setLocked(d);
            }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 1, textTransform: 'uppercase', color: c.ink3 }}>{name}</Text>
            <Text
              accessibilityLabel={`${Math.ceil(f.left / 60)} minutes left`}
              style={{ fontFamily: fonts.display, fontSize: 62, lineHeight: 68, color: c.ink, letterSpacing: -2, fontVariant: ['tabular-nums'] }}
            >
              {clock(f.left)}
            </Text>
            {length > 60 && idle ? (
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: c.ink3 }}>+{length - 60} min past a full turn</Text>
            ) : (
              <View style={{ flexDirection: 'row', gap: 7 }} accessibilityLabel={`Round ${doneInCycle + 1} of ${f.settings.rounds}`}>
                {Array.from({ length: f.settings.rounds }, (_, i) => (
                  <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i < doneInCycle ? MODE_COLORS.focus[1] : c.soft }} />
                ))}
              </View>
            )}
          </FocusDial>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28 }}>
            <RoundButton icon="reset" label="Reset" onPress={f.reset} />
            <RoundButton icon={running ? 'pause' : 'play'} label={running ? 'Pause' : 'Start'} big onPress={toggle} />
            <RoundButton icon="skip" label="Skip to next" onPress={f.skip} />
          </View>

          <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 4 }}>
            <TextInput
              value={f.task}
              onChangeText={f.setTask}
              maxLength={90}
              placeholder="What are you focusing on?"
              placeholderTextColor={c.ink3}
              accessibilityLabel="What you’re focusing on"
              style={{ alignSelf: 'stretch', textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 17, color: c.ink, paddingVertical: 8 }}
            />
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.ink3 }}>{status}</Text>
            {f.stats.rounds > 0 && (
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink2, marginTop: 6 }}>
                🍅 {f.stats.rounds} {f.stats.rounds === 1 ? 'round' : 'rounds'} today · {minutesLabel(f.stats.minutes)} focused
              </Text>
            )}
            {selected && !live && f.timer.status === 'idle' && (
              <Pressable accessibilityRole="button" onPress={() => router.push('/session')} hitSlop={8} style={{ marginTop: 10 }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13.5, color: c.ink2 }}>
                  🌿 Focus with <Text style={{ fontFamily: fonts.bodyBold, color: c.ink }}>{selected.name}</Text> instead ›
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

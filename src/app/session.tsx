import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, DetailScreen } from '@/components/Screen';
import { Body, Button, Card, Chip, Dot, Eyebrow, Field } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { useEntries } from '@/hooks/entries';
import { useSessions } from '@/hooks/sessions';
import { useSquads } from '@/hooks/squads';
import { categoryColor, CATEGORIES, CategoryKey } from '@/lib/categories';
import { clock, SESSION_LENGTHS, SessionLength, secondsLeft } from '@/lib/sessions';
import { supabase } from '@/lib/supabase';
import { fonts, useColors } from '@/theme/tokens';

type Win = { id: string; user_id: string; text: string; category: string };

/** Grow together: a focus session the squad can join. Wins logged in it help the plant. */
export default function SessionScreen() {
  const c = useColors();
  const { session: auth } = useAuth();
  const me = auth?.user.id;
  const { selected } = useSquads();
  const { add, today } = useEntries();
  const { live, joined, start, join, leave, end } = useSessions();
  const [minutes, setMinutes] = useState<SessionLength>(25);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [cat, setCat] = useState<CategoryKey>('study');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [wins, setWins] = useState<Win[]>([]);

  // the countdown
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);

  // everyone's wins since the session started (refetch on your own logs, and every minute)
  const sessionId = live?.session.id;
  const startedAt = live?.session.started_at;
  const memberIds = live?.members.map((m) => m.user_id).join(',') ?? '';
  const myToday = today.length;
  useEffect(() => {
    if (!sessionId || !startedAt || !memberIds) return;
    let alive = true;
    const load = () =>
      supabase
        .from('entries')
        .select('id, user_id, text, category')
        .in('user_id', memberIds.split(','))
        .gte('created_at', startedAt)
        .order('created_at', { ascending: false })
        .limit(30)
        .then(({ data }) => alive && setWins((data ?? []) as Win[]));
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [sessionId, startedAt, memberIds, myToday]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch {
      setErr('That didn’t work. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onLog() {
    const t = text.trim().slice(0, 90);
    if (!t) return;
    setText('');
    try {
      await add(t, cat);
    } catch {
      setText(t);
      setErr('Couldn’t save that. Check your connection and try again.');
    }
  }

  if (!selected) {
    return (
      <DetailScreen title="Grow together">
        <Body style={{ color: c.ink3 }}>Join or start a squad first, then you can grow together.</Body>
      </DetailScreen>
    );
  }

  // ---------- nothing running: start one ----------
  if (!live) {
    return (
      <DetailScreen title="Grow together">
        <Card bg={c.grid[3]} style={{ gap: 6 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: c.onGreen }}>Focus together, grow together.</Text>
          <Body style={{ color: c.onGreen, fontSize: 14 }}>
            Start a session and {selected.name} gets a ping to join. When two or more of you are in it, every win you log gives the plant a bonus.
          </Body>
        </Card>
        <Card style={{ gap: 12 }}>
          <Eyebrow>How long</Eyebrow>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {SESSION_LENGTHS.map((m) => (
              <Chip key={m} label={`${m} min`} selected={minutes === m} onPress={() => setMinutes(m)} />
            ))}
          </View>
          <Eyebrow>What are you working on? (optional)</Eyebrow>
          <View style={{ flexDirection: 'row' }}>
            <Field value={title} onChangeText={setTitle} maxLength={60} placeholder="e.g. Assignment 2" accessibilityLabel="What you’re working on" />
          </View>
          <Button label="Start" disabled={busy} onPress={() => run(() => start(minutes, title))} />
          {err && <Body style={{ color: c.tang, fontSize: 13 }}>{err}</Body>}
        </Card>
      </DetailScreen>
    );
  }

  // ---------- a session is running ----------
  const left = secondsLeft(live.session, now);
  const inNow = live.members.filter((m) => !m.left_at);
  const isHost = live.session.host === me;
  const nameOf = (id: string) => (id === me ? 'You' : live.members.find((m) => m.user_id === id)?.name ?? 'Someone');

  return (
    <DetailScreen title="Grow together">
      <Card bg={c.grid[3]} style={{ gap: 4, alignItems: 'center', paddingVertical: 22 }}>
        {live.session.title && <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.onGreen }}>{live.session.title}</Text>}
        <Text accessibilityLabel={`${Math.ceil(left / 60)} minutes left`} style={{ fontFamily: fonts.mono, fontSize: 56, color: c.onGreen, fontVariant: ['tabular-nums'] }}>
          {clock(left)}
        </Text>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.onGreen }}>
          {inNow.length >= 2 ? '🌿 Plant bonus is on' : 'Bonus starts when a second person joins'}
        </Text>
      </Card>

      <Card style={{ gap: 10 }}>
        <Eyebrow>In the session · {inNow.length}</Eyebrow>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {live.members.map((m) => (
            <View key={m.user_id} style={{ alignItems: 'center', gap: 4, width: 58, opacity: m.left_at ? 0.4 : 1 }}>
              <Avatar emoji={m.emoji} size={44} />
              <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: c.ink }}>
                {m.user_id === me ? 'You' : m.name}
              </Text>
            </View>
          ))}
        </View>
        {!joined && <Button label="Join in" disabled={busy} onPress={() => run(join)} />}
      </Card>

      {joined && (
        <Card style={{ gap: 10 }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: c.ink }}>Log a win</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Field value={text} onChangeText={setText} maxLength={90} placeholder="What did you just get done?" returnKeyType="done" onSubmitEditing={onLog} accessibilityLabel="What you got done" />
            <Button label="Log" onPress={onLog} disabled={!text.trim()} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map((k) => (
              <Chip key={k.key} label={k.label} dot={k.color} selected={cat === k.key} onPress={() => setCat(k.key)} />
            ))}
          </View>
        </Card>
      )}

      <Card style={{ gap: 8 }}>
        <Eyebrow>Done since it started</Eyebrow>
        {wins.length === 0 ? (
          <Body style={{ color: c.ink3 }}>Nothing yet. First win of the session gets the ball rolling.</Body>
        ) : (
          wins.map((w) => (
            <View key={w.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <View style={{ paddingTop: 5 }}>
                <Dot color={categoryColor(w.category)} />
              </View>
              <Body style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold }}>{nameOf(w.user_id)}</Text> {w.text}
              </Body>
            </View>
          ))
        )}
      </Card>

      {err && <Body style={{ color: c.tang, fontSize: 13 }}>{err}</Body>}
      {joined && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => run(leave)} hitSlop={8}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.ink2 }}>Leave</Text>
          </Pressable>
          {isHost && (
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => run(end)} hitSlop={8}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.tang }}>End for everyone</Text>
            </Pressable>
          )}
        </View>
      )}
    </DetailScreen>
  );
}

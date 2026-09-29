import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { MonthGrid } from '@/components/MonthGrid';
import { Screen } from '@/components/Screen';
import { MemberCard } from '@/components/squad/MemberCard';
import { PlantCard } from '@/components/squad/PlantCard';
import { StartOrJoin } from '@/components/squad/StartOrJoin';
import { Body, Button, Card, Chip, Eyebrow, H, Mono } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { squadErrorMessage, useSquads } from '@/hooks/squads';
import { MONTHS, monthAt, ymd } from '@/lib/dates';
import { fonts, radius, useColors } from '@/theme/tokens';

export default function SquadTab() {
  const c = useColors();
  const { session } = useAuth();
  const me = session?.user.id;
  const { squads, selected, select, members, loading, error, refresh, leave, toggleKudo, plant } = useSquads();
  const [adding, setAdding] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // Pick up your own new entries (and friends') whenever the tab is opened.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function onPull() {
    setPulling(true);
    await refresh();
    setPulling(false);
  }

  // ---------- no squads yet ----------
  if (!squads.length) {
    return (
      <Screen refreshing={pulling} onRefresh={onPull}>
        <Card bg={c.lilac}>
          <Eyebrow style={{ color: c.tangInk }}>Your squad</Eyebrow>
          <H style={{ color: c.tangInk }}>Grow with friends</H>
          <Body style={{ color: c.tangInk }}>
            Squadmates see each other’s grids and what they got done today. No rankings, no leaderboard.
          </Body>
        </Card>
        {loading ? <Body style={{ color: c.ink3, textAlign: 'center' }}>Loading…</Body> : <StartOrJoin />}
        {error && <Body style={{ color: c.tang }}>{error}</Body>}
      </Screen>
    );
  }

  // ---------- squad view ----------
  const others = members.filter((m) => m.id !== me);
  const mine = members.find((m) => m.id === me);
  const { y, m } = monthAt(0);
  const todayKey = ymd(new Date());
  const activeToday = members.filter((x) => x.today.length > 0 || (x.counts[todayKey] ?? 0) > 0).length;
  const combined = (d: string) => (members.length ? Math.ceil(members.reduce((a, x) => a + (x.counts[d] ?? 0), 0) / members.length) : 0);
  const combinedCounts: Record<string, number> = {};
  for (const x of members) for (const d of Object.keys(x.counts)) combinedCounts[d] = combined(d);

  async function invite() {
    if (!selected) return;
    await Share.share({
      message: `Join my squad "${selected.name}" on Sprout Squad. Code: ${selected.invite_code}`,
    }).catch(() => {});
  }

  async function onLeave() {
    if (!selected) return;
    setLeaveError(null);
    try {
      await leave(selected.id);
      setConfirmLeave(false);
    } catch (e) {
      setLeaveError(squadErrorMessage(e));
    }
  }

  return (
    <Screen refreshing={pulling} onRefresh={onPull}>
      {/* squad switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 4 }}>
        {squads.map((s) => (
          <Chip
            key={s.id}
            label={s.name}
            selected={!adding && s.id === selected?.id}
            onPress={() => {
              setAdding(false);
              setConfirmLeave(false);
              if (s.id !== selected?.id) select(s.id);
            }}
          />
        ))}
        <Chip label="+ Join or start" selected={adding} onPress={() => setAdding((a) => !a)} />
      </ScrollView>

      {error && <Body style={{ color: c.tang }}>{error}</Body>}

      {adding ? (
        <StartOrJoin onDone={() => setAdding(false)} />
      ) : (
        selected && (
          <>
            {/* header + invite */}
            <Card style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <H size={22}>{selected.name}</H>
                  <Body style={{ fontSize: 13, color: c.ink2 }}>
                    <Mono style={{ fontSize: 13 }}>{members.length || '–'}</Mono>/10 members ·{' '}
                    <Mono style={{ fontSize: 13 }}>{activeToday}</Mono> active today
                  </Body>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: c.screen,
                    borderWidth: 2,
                    borderColor: c.soft,
                    borderRadius: radius.md,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                  }}
                >
                  <Eyebrow style={{ fontSize: 10 }}>Invite code</Eyebrow>
                  <Text selectable style={{ fontFamily: fonts.mono, fontSize: 22, letterSpacing: 4, color: c.ink }}>
                    {selected.invite_code}
                  </Text>
                </View>
                <Button label="Invite" onPress={invite} />
              </View>
            </Card>

            {plant && <PlantCard plant={plant} squadId={selected.id} members={members} me={me} />}

            {/* combined grid: compact so friends show up without much scrolling */}
            <Card style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <View style={{ width: 150 }}>
                <MonthGrid y={y} m={m} counts={combinedCounts} mini gap={3} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Eyebrow>Squad grid · {MONTHS[m]}</Eyebrow>
                <H size={17}>Everyone, combined</H>
                <Body style={{ fontSize: 12.5, lineHeight: 17, color: c.ink3 }}>Each square is the squad’s average for that day.</Body>
              </View>
            </Card>

            {/* members */}
            {others.length === 0 && members.length > 0 && (
              <Card bg={c.lilac}>
                <H style={{ color: c.tangInk }}>It’s just you so far</H>
                <Body style={{ color: c.tangInk }}>Tap Invite and send the code to a few friends.</Body>
              </Card>
            )}
            {others.map((x) => (
              <MemberCard key={x.id} member={x} myId={me} onKudo={(e) => toggleKudo(x.id, e).catch(() => {})} />
            ))}
            {mine && <MemberCard member={mine} isMe />}

            {/* leave */}
            <View style={{ gap: 8, paddingTop: 4 }}>
              {confirmLeave ? (
                <Card>
                  <Body>
                    Leave <Text style={{ fontFamily: fonts.bodyBold }}>{selected.name}</Text>? You’ll need the code to rejoin.
                    {others.length === 0 ? ' You’re the last member, so the squad will be deleted.' : ''}
                  </Body>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button label="Leave squad" onPress={onLeave} />
                    <Button label="Cancel" variant="ghost" onPress={() => setConfirmLeave(false)} />
                  </View>
                  {leaveError && <Body style={{ color: c.tang, fontSize: 14 }}>{leaveError}</Body>}
                </Card>
              ) : (
                <Pressable accessibilityRole="button" onPress={() => setConfirmLeave(true)} style={{ alignSelf: 'center', padding: 8 }}>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.ink3 }}>Leave this squad</Text>
                </Pressable>
              )}
            </View>
          </>
        )
      )}
    </Screen>
  );
}

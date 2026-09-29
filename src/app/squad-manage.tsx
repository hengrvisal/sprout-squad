import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MonthGrid } from '@/components/MonthGrid';
import { DetailScreen } from '@/components/Screen';
import { StartOrJoin } from '@/components/squad/StartOrJoin';
import { Body, Button, Card, Divider, Eyebrow, H } from '@/components/ui';
import { squadErrorMessage, useSquads } from '@/hooks/squads';
import { MONTHS, monthAt } from '@/lib/dates';
import { shareInvite } from '@/lib/invite';
import { fonts, radius, useColors } from '@/theme/tokens';

/** Invite, switch between squads, join or start another, see the squad's combined month, leave. */
export default function SquadManage() {
  const c = useColors();
  const { squads, selected, select, members, leave } = useSquads();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const { y, m } = monthAt(0);

  const combined: Record<string, number> = {};
  for (const x of members)
    for (const d of Object.keys(x.counts)) combined[d] = Math.ceil(members.reduce((a, mm) => a + (mm.counts[d] ?? 0), 0) / members.length);

  async function onLeave() {
    if (!selected) return;
    setLeaveError(null);
    try {
      await leave(selected.id);
      setConfirmLeave(false);
      router.back();
    } catch (e) {
      setLeaveError(squadErrorMessage(e));
    }
  }

  return (
    <DetailScreen title="Squads">
      {selected && (
        <Card style={{ gap: 10 }}>
          <Eyebrow>Invite to {selected.name}</Eyebrow>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text selectable style={{ flex: 1, fontFamily: fonts.mono, fontSize: 28, letterSpacing: 5, color: c.ink }}>
              {selected.invite_code}
            </Text>
            <Button label="Share" onPress={() => shareInvite(selected)} />
          </View>
          <Body style={{ fontSize: 13, color: c.ink3 }}>{members.length}/10 members. Friends join from Squad → Join with this code.</Body>
        </Card>
      )}

      {squads.length > 1 && (
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          <Eyebrow style={{ paddingTop: 8, paddingBottom: 4 }}>Your squads</Eyebrow>
          {squads.map((s, i) => (
            <View key={s.id}>
              {i > 0 && <Divider />}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: s.id === selected?.id }}
                onPress={() => {
                  if (s.id !== selected?.id) select(s.id);
                  router.back();
                }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13 }}
              >
                <Text style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 16, color: c.ink }}>{s.name}</Text>
                {s.id === selected?.id && <Text style={{ fontFamily: fonts.bodyBold, color: c.grid[4] }}>✓</Text>}
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      {selected && members.length > 1 && (
        <Card style={{ gap: 10 }}>
          <Eyebrow>{MONTHS[m]} · everyone, combined</Eyebrow>
          <MonthGrid y={y} m={m} counts={combined} mini gap={4} />
          <Body style={{ fontSize: 12.5, color: c.ink3 }}>Each square is the squad’s average for that day.</Body>
        </Card>
      )}

      <H size={18} style={{ marginTop: 6 }}>Join or start another</H>
      <StartOrJoin onDone={() => router.back()} />

      {selected && (
        <View style={{ gap: 8, paddingTop: 6 }}>
          {confirmLeave ? (
            <Card>
              <Body>
                Leave <Text style={{ fontFamily: fonts.bodyBold }}>{selected.name}</Text>? You’ll need the code to rejoin.
                {members.length <= 1 ? ' You’re the last member, so the squad will be deleted.' : ''}
              </Body>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button label="Leave squad" onPress={onLeave} />
                <Button label="Cancel" variant="ghost" onPress={() => setConfirmLeave(false)} />
              </View>
              {leaveError && <Body style={{ color: c.tang, fontSize: 14 }}>{leaveError}</Body>}
            </Card>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmLeave(true)}
              style={{ alignSelf: 'center', padding: 10, borderRadius: radius.md }}
            >
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.ink3 }}>Leave {selected.name}</Text>
            </Pressable>
          )}
        </View>
      )}
    </DetailScreen>
  );
}

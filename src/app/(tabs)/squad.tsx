import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Screen } from '@/components/Screen';
import { Garden } from '@/components/squad/Garden';
import { StartOrJoin } from '@/components/squad/StartOrJoin';
import { Body, Card, Chunky, Eyebrow, H, Mono, ProgressBar } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { useSessions } from '@/hooks/sessions';
import { useSquads } from '@/hooks/squads';
import { shareInvite } from '@/lib/invite';
import { leftLabel, namesLabel, secondsLeft } from '@/lib/sessions';
import { fonts, radius, useColors } from '@/theme/tokens';

/**
 * Squad: the plant you grow together is the star, then this week's goal, focus sessions and friends.
 * Tap the plant to poke it, Details for the rest; tap a friend for their grid and kudos;
 * tap the squad name to invite, switch, join or leave.
 */
export default function SquadTab() {
  const c = useColors();
  const { session } = useAuth();
  const me = session?.user.id;
  const { squads, selected, members, loading, error, refresh, plant } = useSquads();
  const { live, joined } = useSessions();
  const inSession = live ? live.members.filter((x) => !x.left_at).map((x) => (x.user_id === me ? 'You' : x.name)) : [];
  const [pulling, setPulling] = useState(false);

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

  if (!squads.length || !selected) {
    return (
      <Screen title="Squad" refreshing={pulling} onRefresh={onPull}>
        <Card bg={c.lilac}>
          <H style={{ color: c.tangInk }}>Grow a plant with friends</H>
          <Body style={{ color: c.tangInk }}>
            Every day your squad logs something, your shared plant grows. You’ll see each other’s grids and send kudos. No rankings.
          </Body>
        </Card>
        {loading ? <Body style={{ color: c.ink3, textAlign: 'center' }}>Loading…</Body> : <StartOrJoin />}
        {error && <Body style={{ color: c.tang }}>{error}</Body>}
      </Screen>
    );
  }

  const others = members.filter((x) => x.id !== me);
  const active = members.map((x) => ({ id: x.id, emoji: x.emoji, on: x.today.length > 0, name: x.id === me ? 'You' : x.display_name || 'Someone' }));
  // who's shown up first, so the row of faces fills from the left
  active.sort((a, b) => Number(b.on) - Number(a.on));

  return (
    <Screen
      subtitle={squads.length > 1 ? `Squad · ${squads.length} squads` : 'Squad'}
      titleNode={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${selected.name}. Manage squads`}
          onPress={() => router.push('/squad-manage')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fonts.display, fontSize: 32, color: c.ink, letterSpacing: -0.8 }}>
            {selected.name}
          </Text>
          <Text style={{ fontFamily: fonts.mono, fontSize: 18, color: c.ink3, marginTop: 6 }}>▾</Text>
        </Pressable>
      }
      right={
        <Pressable
          accessibilityRole="button"
          onPress={() => shareInvite(selected)}
          style={{ borderWidth: 2, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: c.card, marginBottom: 4 }}
        >
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.ink }}>＋ Invite</Text>
        </Pressable>
      }
      refreshing={pulling}
      onRefresh={onPull}
    >
      {error && <Body style={{ color: c.tang, fontSize: 13 }}>{error}</Body>}

      {/* 1. the plant, front and centre */}
      {plant ? (
        <Garden plant={plant} seedKey={selected.id} active={active} onOpen={() => router.push('/plant')} />
      ) : (
        <Chunky style={{ height: 300, alignItems: 'center', justifyContent: 'center' }}>
          <Body style={{ color: c.ink3 }}>Watering the plant…</Body>
        </Chunky>
      )}

      {/* 2. this week's goal */}
      {plant?.week?.label && (
        <Pressable accessibilityRole="button" accessibilityLabel="Open this week’s goal" onPress={() => router.push('/plant')}>
          {({ pressed }) => (
            <Card bg={plant.week.met ? c.grid[1] : c.card} style={{ gap: 8, opacity: pressed ? 0.6 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 22 }}>{plant.week.met ? '🏆' : '🎯'}</Text>
                <View style={{ flex: 1 }}>
                  <Eyebrow style={plant.week.met ? { color: c.onGreen } : undefined}>This week, together</Eyebrow>
                  <Text numberOfLines={2} style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: plant.week.met ? c.onGreen : c.ink }}>
                    {plant.week.label}
                  </Text>
                </View>
                <Mono style={{ fontSize: 15, color: plant.week.met ? c.onGreen : c.ink }}>
                  {plant.week.progress}/{plant.week.target}
                </Mono>
              </View>
              <ProgressBar value={plant.week.progress / Math.max(1, plant.week.target)} color={plant.week.met ? c.grid[4] : c.lilac} height={10} />
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: plant.week.met ? c.onGreen : c.ink3 }}>
                {plant.week.met ? `Goal hit! Growth spurt +${plant.week.bonus} 🌱` : 'Hit it for a 20% growth spurt'}
              </Text>
            </Card>
          )}
        </Pressable>
      )}

      {/* 3. focus together: live banner, or a way to start one */}
      <Pressable accessibilityRole="button" onPress={() => router.push(live ? '/session' : '/focus')}>
        {({ pressed }) => (
          <Chunky bg={live ? c.grid[3] : c.card} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.6 : 1 }}>
            <Text style={{ fontSize: 24 }}>{live ? '🌿' : '⏱️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: live ? c.onGreen : c.ink }}>
                {live
                  ? `${namesLabel(inSession)} ${inSession.length === 1 && inSession[0] !== 'You' ? 'is' : 'are'} focusing together`
                  : 'Focus together'}
              </Text>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: live ? c.onGreen : c.ink3 }}>
                {live ? `${leftLabel(secondsLeft(live.session))} · ${joined ? 'You’re in' : 'Tap to join'}` : 'Wins logged in a shared session give the plant a bonus'}
              </Text>
            </View>
            <Text style={{ fontFamily: fonts.mono, fontSize: 20, color: live ? c.onGreen : c.ink3 }}>›</Text>
          </Chunky>
        )}
      </Pressable>

      {/* 4. friends */}
      <Card style={{ gap: 12 }}>
        <Eyebrow>Friends today</Eyebrow>
        {others.length === 0 ? (
          <Pressable onPress={() => shareInvite(selected)}>
            <Body style={{ color: c.ink2 }}>
              It’s just you so far. Plants grow faster with friends. <Text style={{ fontFamily: fonts.bodyBold, color: c.ink }}>Invite one ›</Text>
            </Body>
          </Pressable>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
            {others.map((f) => {
              const n = f.today.length;
              return (
                <Pressable
                  key={f.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${f.display_name || 'Someone'}, ${n} today. Open`}
                  onPress={() => router.push({ pathname: '/friend/[id]', params: { id: f.id } })}
                  style={({ pressed }) => ({ width: '25%', alignItems: 'center', gap: 6, opacity: pressed ? 0.6 : 1 })}
                >
                  <View>
                    <Avatar emoji={f.emoji} size={54} />
                    <View
                      style={{
                        position: 'absolute',
                        right: -5,
                        bottom: -3,
                        minWidth: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: c.line,
                        backgroundColor: n > 0 ? c.grid[3] : c.soft,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      }}
                    >
                      <Mono style={{ fontSize: 11.5, color: n > 0 ? c.onGreen : c.ink3 }}>{n > 0 ? n : '·'}</Mono>
                    </View>
                  </View>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.ink, maxWidth: 76 }}>
                    {f.display_name || 'Someone'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Card>
    </Screen>
  );
}

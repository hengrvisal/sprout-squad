import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Avatar, Screen } from '@/components/Screen';
import { Plant } from '@/components/squad/Plant';
import { StartOrJoin } from '@/components/squad/StartOrJoin';
import { Body, Card, Dot, Eyebrow, H, Mono, ProgressBar, TapCard } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { useSquads } from '@/hooks/squads';
import { shareInvite } from '@/lib/invite';
import { healthLabel, stageFor } from '@/lib/plant';
import { fonts, radius, useColors } from '@/theme/tokens';

/**
 * Squad: the plant you grow together, and who's shown up today.
 * Tap the plant for its details and the weekly goal; tap a friend for their grid and kudos;
 * tap the squad name to invite, switch, join or leave.
 */
export default function SquadTab() {
  const c = useColors();
  const { session } = useAuth();
  const me = session?.user.id;
  const { squads, selected, members, loading, error, refresh, plant } = useSquads();
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
  const stage = plant ? stageFor(plant.growth) : null;
  const health = plant ? healthLabel(plant.health, plant.drooping) : null;
  const toneColor = health?.tone === 'good' ? c.grid[3] : health?.tone === 'ok' ? c.sky : c.tang;

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
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.ink }}>Invite</Text>
        </Pressable>
      }
      refreshing={pulling}
      onRefresh={onPull}
    >
      {error && <Body style={{ color: c.tang, fontSize: 13 }}>{error}</Body>}

      {/* 1. the plant */}
      <TapCard label="Open squad plant" onPress={() => router.push('/plant')} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 132, alignItems: 'center' }}>
            {plant && stage ? (
              <Plant stage={stage.index} progress={stage.progress} health={plant.health} drooping={plant.drooping} members={plant.members} seedKey={selected.id} size={132} />
            ) : (
              <View style={{ height: 145 }} />
            )}
          </View>
          <View style={{ flex: 1, gap: 6, paddingRight: 10 }}>
            <Eyebrow>Squad plant</Eyebrow>
            <H size={24}>{stage?.name ?? '…'}</H>
            {health && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Dot color={toneColor} />
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.ink2, flexShrink: 1 }}>{health.label}</Text>
              </View>
            )}
            {plant && (
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.ink2 }}>
                <Mono style={{ fontSize: 13 }}>{plant.today.active}/{plant.today.members}</Mono> showed up today
              </Text>
            )}
            {stage && <ProgressBar value={stage.progress} color={c.grid[3]} height={9} />}
          </View>
        </View>
        {plant?.week?.label && (
          <View style={{ gap: 6, borderTopWidth: 1.5, borderTopColor: c.soft, paddingTop: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink }}>
                {plant.week.met ? '✅ ' : ''}This week: {plant.week.label}
              </Text>
              <Mono style={{ fontSize: 12.5, color: c.ink3 }}>
                {plant.week.progress}/{plant.week.target}
              </Mono>
            </View>
            <ProgressBar value={plant.week.progress / Math.max(1, plant.week.target)} color={plant.week.met ? c.grid[4] : c.lilac} height={8} />
          </View>
        )}
      </TapCard>

      {/* 2. friends today */}
      <Card style={{ gap: 10, paddingHorizontal: 0 }}>
        <Eyebrow style={{ paddingHorizontal: 16 }}>Friends today</Eyebrow>
        {others.length === 0 ? (
          <Pressable onPress={() => shareInvite(selected)} style={{ paddingHorizontal: 16 }}>
            <Body style={{ color: c.ink2 }}>
              It’s just you so far. <Text style={{ fontFamily: fonts.bodyBold, color: c.ink }}>Invite a friend ›</Text>
            </Body>
          </Pressable>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}>
            {others.map((f) => {
              const n = f.today.length;
              return (
                <Pressable
                  key={f.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${f.display_name || 'Someone'}, ${n} today. Open`}
                  onPress={() => router.push({ pathname: '/friend/[id]', params: { id: f.id } })}
                  style={({ pressed }) => ({ alignItems: 'center', gap: 6, width: 64, opacity: pressed ? 0.6 : 1 })}
                >
                  <View>
                    <Avatar emoji={f.emoji} size={52} />
                    <View
                      style={{
                        position: 'absolute',
                        right: -4,
                        bottom: -2,
                        minWidth: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: c.line,
                        backgroundColor: n > 0 ? c.grid[3] : c.soft,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      }}
                    >
                      <Mono style={{ fontSize: 11, color: n > 0 ? c.onGreen : c.ink3 }}>{n}</Mono>
                    </View>
                  </View>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.ink }}>
                    {f.display_name || 'Someone'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </Card>
    </Screen>
  );
}

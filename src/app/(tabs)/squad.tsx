import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Face, Garden } from '@/components/squad/Garden';
import { StartOrJoin } from '@/components/squad/StartOrJoin';
import { Chunky } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { useSquads } from '@/hooks/squads';
import { shareInvite } from '@/lib/invite';
import { fonts, useColors } from '@/theme/tokens';

/**
 * Squad does one thing: show the plant you grow together.
 * Tap the name to switch/manage squads, a face to visit a friend, the goal for plant details.
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
      <Screen gradient="squad" title="Squad" refreshing={pulling} onRefresh={onPull}>
        <View style={{ gap: 8, marginTop: 8 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: c.ink, letterSpacing: -0.8 }}>Grow a plant{'\n'}with friends 🌱</Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15.5, lineHeight: 22, color: c.ink2 }}>
            Every day your squad logs something, it grows. No rankings, just cheering each other on.
          </Text>
        </View>
        {loading ? <Text style={{ fontFamily: fonts.bodyMedium, color: c.ink3, textAlign: 'center' }}>Loading…</Text> : <StartOrJoin />}
        {error && <Text style={{ fontFamily: fonts.bodySemi, color: c.tang }}>{error}</Text>}
      </Screen>
    );
  }

  const faces: Face[] = members
    .map((x) => ({ id: x.id, emoji: x.emoji, on: x.today.length > 0, name: x.id === me ? 'You' : x.display_name || 'Someone', me: x.id === me }))
    // who's shown up first
    .sort((a, b) => Number(b.on) - Number(a.on));
  const w = plant?.week;

  return (
    <Screen
      gradient="squad"
      subtitle={squads.length > 1 ? `${squads.length} squads` : 'Your squad'}
      titleNode={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${selected.name}. Manage squads`}
          onPress={() => router.push('/squad-manage')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fonts.display, fontSize: 30, color: c.ink, letterSpacing: -0.8 }}>
            {selected.name}
          </Text>
          <Icon name="chevron-down" size={20} color={c.ink3} />
        </Pressable>
      }
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Invite friends"
          onPress={() => shareInvite(selected)}
          hitSlop={8}
          style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, backgroundColor: c.glassStrong, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
        >
          <Icon name="share" size={20} color={c.ink2} />
        </Pressable>
      }
      refreshing={pulling}
      onRefresh={onPull}
    >
      {error && <Text style={{ fontFamily: fonts.bodySemi, color: c.tang, fontSize: 13 }}>{error}</Text>}

      {plant ? (
        <Garden plant={plant} seedKey={selected.id} faces={faces} />
      ) : (
        <Chunky style={{ height: 460, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.bodyMedium, color: c.ink3 }}>Watering the plant…</Text>
        </Chunky>
      )}

      {w?.label && (
        <Pressable accessibilityRole="button" accessibilityLabel="This week’s goal. Open plant details" onPress={() => router.push('/plant')}>
          {({ pressed }) => (
            <View style={{ gap: 8, paddingHorizontal: 4, opacity: pressed ? 0.6 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>{w.met ? '🏆' : '🎯'}</Text>
                <Text numberOfLines={1} style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 14.5, color: c.ink }}>
                  {w.met ? 'Weekly goal hit, growth spurt!' : w.label}
                </Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: c.ink2 }}>
                  {w.progress}/{w.target} ›
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: c.soft, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(100, Math.round((w.progress / Math.max(1, w.target)) * 100))}%`, height: '100%', borderRadius: 3, backgroundColor: w.met ? c.accent : c.lilac }} />
              </View>
            </View>
          )}
        </Pressable>
      )}
    </Screen>
  );
}

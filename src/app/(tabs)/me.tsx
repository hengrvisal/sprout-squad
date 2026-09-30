import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Screen } from '@/components/Screen';
import { Chunky, Divider, Row } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { useProfile } from '@/hooks/profile';
import { streak } from '@/lib/dates';
import { fonts, useColors } from '@/theme/tokens';

/** Me: who you are and your year in three numbers. Everything else is a row. */
export default function Me() {
  const c = useColors();
  const { profile } = useProfile();
  const { counts } = useEntries();
  const year = new Date().getFullYear();
  const thisYear = Object.entries(counts).filter(([k, n]) => k.startsWith(`${year}-`) && n > 0);
  const stats: [number, string][] = [
    [streak(counts), 'day streak'],
    [thisYear.length, 'green days'],
    [thisYear.reduce((a, [, n]) => a + n, 0), 'things done'],
  ];

  return (
    <Screen gradient="me" title="Me">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
        onPress={() => router.push('/profile')}
        style={({ pressed }) => ({ alignItems: 'center', gap: 10, marginTop: 4, opacity: pressed ? 0.7 : 1 })}
      >
        <Avatar emoji={profile?.emoji} size={92} />
        <Text numberOfLines={1} style={{ fontFamily: fonts.display, fontSize: 28, color: c.ink, letterSpacing: -0.6 }}>
          {profile?.display_name || 'Add your name'}
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {stats.map(([n, label]) => (
          <View key={label} style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, color: c.ink }}>{n}</Text>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.ink3 }}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={{ marginTop: -12, textAlign: 'center', fontFamily: fonts.bodyMedium, fontSize: 12, color: c.ink3 }}>in {year}</Text>

      <Chunky style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
        <Row label="Your last 7 days" onPress={() => router.push('/week')} />
        <Divider />
        <Row label="Search your wins" onPress={() => router.push('/search')} />
        <Divider />
        <Row label="Notifications" onPress={() => router.push('/notifications')} />
        <Divider />
        <Row label="Account & privacy" onPress={() => router.push('/account')} />
      </Chunky>
    </Screen>
  );
}

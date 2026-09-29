import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { MonthGrid } from '@/components/MonthGrid';
import { Avatar, Screen } from '@/components/Screen';
import { Card, Divider, Eyebrow, Mono, Row, TapCard } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { useRecentEntries } from '@/hooks/recent';
import { useProfile } from '@/hooks/profile';
import { MONTHS, monthAt, streak } from '@/lib/dates';
import { weekRecap } from '@/lib/recap';
import { fonts, useColors } from '@/theme/tokens';

/** Me: who you are, your numbers, your month, and settings. */
export default function Me() {
  const c = useColors();
  const { profile } = useProfile();
  const { counts } = useEntries();
  const { entries: recent } = useRecentEntries();
  const recap = recent ? weekRecap(recent, counts) : null;
  const { y, m } = monthAt(0);
  const year = new Date().getFullYear();
  const thisYear = Object.entries(counts).filter(([k, n]) => k.startsWith(`${year}-`) && n > 0);
  const stats: [number, string][] = [
    [streak(counts), 'day streak'],
    [thisYear.length, 'green days'],
    [thisYear.reduce((a, [, n]) => a + n, 0), 'things done'],
  ];

  return (
    <Screen
      subtitle="Me"
      titleNode={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          onPress={() => router.push('/profile')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}
        >
          <Avatar emoji={profile?.emoji} size={52} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontFamily: fonts.display, fontSize: 28, color: c.ink, letterSpacing: -0.6 }}>
              {profile?.display_name || 'Add your name'}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.ink3 }}>Edit profile ›</Text>
          </View>
        </Pressable>
      }
    >
      <Card style={{ flexDirection: 'row', paddingVertical: 14 }}>
        {stats.map(([n, label], i) => (
          <View key={label} style={{ flex: 1, alignItems: 'center', gap: 2, borderLeftWidth: i ? 1.5 : 0, borderLeftColor: c.soft }}>
            <Mono style={{ fontSize: 26 }}>{n}</Mono>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: c.ink3 }}>{label}</Text>
          </View>
        ))}
      </Card>
      <Text style={{ marginTop: -10, textAlign: 'center', fontFamily: fonts.body, fontSize: 11.5, color: c.ink3 }}>This year · {year}</Text>

      <TapCard label="Open your last 7 days" onPress={() => router.push('/week')} style={{ gap: 4 }}>
        <Eyebrow>Your last 7 days</Eyebrow>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: c.ink, paddingRight: 18 }}>{recap?.lines[0] ?? 'Looking back…'}</Text>
      </TapCard>

      <TapCard label="Open month history" onPress={() => router.push('/month')} style={{ gap: 10 }}>
        <Eyebrow>{MONTHS[m]}</Eyebrow>
        <MonthGrid y={y} m={m} counts={counts} mini gap={4} />
      </TapCard>

      <Card style={{ gap: 0, paddingVertical: 4 }}>
        <Row label="Search your wins" onPress={() => router.push('/search')} />
        <Divider />
        <Row label="Edit profile" onPress={() => router.push('/profile')} />
        <Divider />
        <Row label="Account" value="Sign out, delete" onPress={() => router.push('/account')} />
        <Divider />
        <Row label="Privacy & support" value="sproutsquad.app" onPress={() => router.push('/account')} />
      </Card>
    </Screen>
  );
}

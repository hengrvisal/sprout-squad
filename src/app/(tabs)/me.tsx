import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { MonthGrid, MonthHeader, MonthSummary } from '@/components/MonthGrid';
import { Screen } from '@/components/Screen';
import { Body, Button, Card, Eyebrow, H, Mono } from '@/components/ui';
import { deleteAccount, signOut } from '@/hooks/auth';
import { useEntries } from '@/hooks/entries';
import { Profile, useProfile } from '@/hooks/profile';
import { AVATARS } from '@/lib/categories';
import { monthAt, streak } from '@/lib/dates';
import { border, fonts, radius, useColors } from '@/theme/tokens';

export default function Me() {
  const c = useColors();
  const { profile } = useProfile();
  const { counts, ensureMonth } = useEntries();
  const [offset, setOffset] = useState(0);
  const { y, m } = monthAt(offset);
  const year = new Date().getFullYear();
  const thisYear = Object.entries(counts).filter(([k, n]) => k.startsWith(`${year}-`) && n > 0);
  const greenDays = thisYear.length;
  const total = thisYear.reduce((a, [, n]) => a + n, 0);

  return (
    <Screen>
      {profile && <ProfileForm key={`${profile.display_name}|${profile.emoji}`} profile={profile} />}

      <Card style={{ flexDirection: 'row', gap: 8 }}>
        {[
          [streak(counts), 'day streak'],
          [greenDays, `green days in ${year}`],
          [total, `done in ${year}`],
        ].map(([n, label]) => (
          <View key={label} style={{ flex: 1, backgroundColor: c.screen, borderWidth: 2, borderColor: c.soft, borderRadius: radius.md, padding: 10, gap: 2 }}>
            <Mono style={{ fontSize: 22 }}>{n}</Mono>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, color: c.ink3 }}>{label}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <MonthHeader y={y} m={m} offset={offset} onChange={(o) => { setOffset(o); const mm = monthAt(o); ensureMonth(mm.y, mm.m); }} />
        <MonthGrid y={y} m={m} counts={counts} />
        <MonthSummary counts={counts} y={y} m={m} />
      </Card>

      <Button label="Sign out" variant="ghost" onPress={() => signOut()} />
      <DeleteAccount />
    </Screen>
  );
}

/** Keyed on the saved values, so it re-initialises whenever the stored profile changes. */
function ProfileForm({ profile }: { profile: Profile }) {
  const c = useColors();
  const { save } = useProfile();
  const [name, setName] = useState(profile.display_name);
  const [emoji, setEmoji] = useState(profile.emoji);
  const [status, setStatus] = useState<string | null>(null);
  const dirty = name.trim() !== profile.display_name || emoji !== profile.emoji;

  async function onSave() {
    try {
      await save({ display_name: name.trim().slice(0, 24), emoji });
    } catch {
      setStatus('Couldn’t save your profile. Try again.');
    }
  }

  return (
      <Card style={{ gap: 14 }}>
      <H>Your profile</H>
      <View style={{ gap: 6 }}>
        <Eyebrow>Display name</Eyebrow>
        <TextInput
          value={name}
          onChangeText={(t) => { setName(t); setStatus(null); }}
          maxLength={24}
          placeholder="Pick a name"
          placeholderTextColor={c.ink3}
          accessibilityLabel="Display name"
          style={{
            backgroundColor: c.screen,
            borderWidth: border,
            borderColor: c.line,
            borderRadius: radius.md,
            paddingVertical: 10,
            paddingHorizontal: 12,
            fontFamily: fonts.body,
            fontSize: 15,
            color: c.ink,
          }}
        />
      </View>
      <View style={{ gap: 6 }}>
        <Eyebrow>Avatar</Eyebrow>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {AVATARS.map((a) => (
            <Pressable
              key={a}
              accessibilityRole="button"
              accessibilityState={{ selected: emoji === a }}
              onPress={() => { setEmoji(a); setStatus(null); }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: emoji === a ? c.line : c.soft,
                backgroundColor: emoji === a ? c.lilac : c.screen,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 22 }}>{a}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Button label="Save profile" onPress={onSave} disabled={!dirty} />
        {status && <Body style={{ color: c.ink2, fontSize: 14 }}>{status}</Body>}
      </View>
    </Card>
  );
}

/** Two-step delete. Apple requires in-app account deletion for App Store apps. */
function DeleteAccount() {
  const c = useColors();
  const [step, setStep] = useState<'idle' | 'confirm' | 'busy'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (step === 'idle') {
    return (
      <Pressable accessibilityRole="button" onPress={() => setStep('confirm')} style={{ alignSelf: 'center', padding: 8 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.ink3 }}>Delete account</Text>
      </Pressable>
    );
  }

  async function onDelete() {
    setStep('busy');
    setError(null);
    try {
      await deleteAccount(); // the auth guard sends you back to sign-in
    } catch {
      setError('Couldn’t delete your account. Check your connection and try again.');
      setStep('confirm');
    }
  }

  return (
    <Card>
      <H>Delete your account?</H>
      <Body style={{ color: c.ink2, fontSize: 14 }}>
        This permanently removes your profile, everything you’ve logged, your kudos, and you from every squad. It can’t be undone.
      </Body>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button label={step === 'busy' ? 'Deleting…' : 'Delete forever'} onPress={onDelete} disabled={step === 'busy'} />
        <Button label="Keep my account" variant="ghost" onPress={() => setStep('idle')} disabled={step === 'busy'} />
      </View>
      {error && <Body style={{ color: c.tang, fontSize: 14 }}>{error}</Body>}
    </Card>
  );
}

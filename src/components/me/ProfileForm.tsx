import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Body, Button, Card, Eyebrow, H } from '@/components/ui';
import { Profile, useProfile } from '@/hooks/profile';
import { AVATARS } from '@/lib/categories';
import { border, fonts, radius, useColors } from '@/theme/tokens';

/** Keyed on the saved values, so it re-initialises whenever the stored profile changes. */
export function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved?: () => void }) {
  const c = useColors();
  const { save } = useProfile();
  const [name, setName] = useState(profile.display_name);
  const [emoji, setEmoji] = useState(profile.emoji);
  const [status, setStatus] = useState<string | null>(null);
  const dirty = name.trim() !== profile.display_name || emoji !== profile.emoji;

  async function onSave() {
    try {
      await save({ display_name: name.trim().slice(0, 24), emoji });
      onSaved?.();
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


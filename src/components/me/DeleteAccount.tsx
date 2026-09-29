import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Body, Button, Card, H } from '@/components/ui';
import { deleteAccount } from '@/hooks/auth';
import { fonts, useColors } from '@/theme/tokens';

/** Two-step delete. Apple requires in-app account deletion for App Store apps. */
export function DeleteAccount() {
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

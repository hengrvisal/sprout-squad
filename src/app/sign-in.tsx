import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Card, Eyebrow, H } from '@/components/ui';
import { sendCode, verifyCode } from '@/hooks/auth';
import { border, fonts, radius, useColors } from '@/theme/tokens';

export default function SignIn() {
  const c = useColors();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = {
    backgroundColor: c.screen,
    borderWidth: border,
    borderColor: c.line,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontFamily: fonts.body,
    fontSize: 16,
    color: c.ink,
  } as const;

  async function onSend() {
    setBusy(true);
    setError(null);
    try {
      await sendCode(email.trim());
      setStep('code');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the code. Check the email and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onVerify() {
    setBusy(true);
    setError(null);
    try {
      await verifyCode(email.trim(), code.trim());
      // AuthProvider picks up the session and the router guard switches to the tabs.
    } catch {
      setError('That code didn’t work. Check the latest email, or send a new one.');
    } finally {
      setBusy(false);
    }
  }

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.ground }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20, gap: 28, maxWidth: 480, width: '100%', alignSelf: 'center' }}
      >
        <View style={{ gap: 10 }}>
          <Eyebrow>Sprout Squad</Eyebrow>
          <Text style={{ fontFamily: fonts.display, fontSize: 48, lineHeight: 48, color: c.ink, letterSpacing: -1 }}>
            Grow your green together.
          </Text>
          <Body style={{ color: c.ink2, fontSize: 16 }}>Log the productive things you do each day. Your squad sees your grid fill up.</Body>
        </View>

        <Card>
          {step === 'email' ? (
            <>
              <H>Sign in with email</H>
              <TextInput
                style={input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={c.ink3}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                inputMode="email"
                onSubmitEditing={() => validEmail && onSend()}
              />
              <Button label={busy ? 'Sending…' : 'Email me a code'} onPress={onSend} disabled={!validEmail || busy} />
            </>
          ) : (
            <>
              <H>Enter your code</H>
              <Body style={{ color: c.ink2 }}>We sent a sign-in code to {email.trim()}.</Body>
              <TextInput
                style={[input, { fontFamily: fonts.mono, fontSize: 22, letterSpacing: 6, textAlign: 'center' }]}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="Code"
                placeholderTextColor={c.ink3}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                onSubmitEditing={() => code.length >= 6 && onVerify()}
              />
              <Button label={busy ? 'Checking…' : 'Sign in'} onPress={onVerify} disabled={code.length < 6 || busy} />
              <Button label="Use a different email" variant="ghost" onPress={() => { setStep('email'); setCode(''); }} />
            </>
          )}
          {error && <Body style={{ color: c.tang, fontSize: 14 }}>{error}</Body>}
        </Card>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

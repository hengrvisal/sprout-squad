import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Card, Field, H } from '@/components/ui';
import { squadErrorMessage, useSquads } from '@/hooks/squads';
import { fonts, useColors } from '@/theme/tokens';

/** Two small forms: start a new squad, or join one with a code. */
export function StartOrJoin({ onDone }: { onDone?: () => void }) {
  const c = useColors();
  const { create, join } = useSquads();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<{ form: 'create' | 'join'; msg: string } | null>(null);

  async function run(form: 'create' | 'join') {
    setBusy(form);
    setError(null);
    try {
      if (form === 'create') await create(name.trim());
      else await join(code.trim());
      setName('');
      setCode('');
      onDone?.();
    } catch (e) {
      setError({ form, msg: squadErrorMessage(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Card>
        <H>Got a code?</H>
        <Body style={{ color: c.ink2, fontSize: 14 }}>Join a friend’s squad with the 6-letter code they sent you.</Body>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Field
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="ABC234"
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Invite code"
            onSubmitEditing={() => code.length === 6 && run('join')}
            style={{ fontFamily: fonts.mono, fontSize: 18, letterSpacing: 4 }}
          />
          <Button label={busy === 'join' ? 'Joining…' : 'Join'} onPress={() => run('join')} disabled={code.length !== 6 || !!busy} />
        </View>
        {error?.form === 'join' && <Body style={{ color: c.tang, fontSize: 14 }}>{error.msg}</Body>}
      </Card>

      <Card>
        <H>Start a squad</H>
        <Body style={{ color: c.ink2, fontSize: 14 }}>Name it, then send the invite code to up to 9 friends.</Body>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Field
            value={name}
            onChangeText={setName}
            maxLength={30}
            placeholder="e.g. Uni crew"
            accessibilityLabel="Squad name"
            onSubmitEditing={() => name.trim() && run('create')}
          />
          <Button label={busy === 'create' ? 'Creating…' : 'Create'} onPress={() => run('create')} disabled={!name.trim() || !!busy} />
        </View>
        {error?.form === 'create' && <Body style={{ color: c.tang, fontSize: 14 }}>{error.msg}</Body>}
      </Card>
    </>
  );
}

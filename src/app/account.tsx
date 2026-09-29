import { Linking, View } from 'react-native';
import { DeleteAccount } from '@/components/me/DeleteAccount';
import { DetailScreen } from '@/components/Screen';
import { Body, Button, Card, Divider, Eyebrow, Row } from '@/components/ui';
import { signOut, useAuth } from '@/hooks/auth';
import { useColors } from '@/theme/tokens';

export default function Account() {
  const c = useColors();
  const { session } = useAuth();
  return (
    <DetailScreen title="Account">
      <Card style={{ gap: 6 }}>
        <Eyebrow>Signed in as</Eyebrow>
        <Body>{session?.user.email ?? '—'}</Body>
      </Card>
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        <Row label="Privacy" onPress={() => Linking.openURL('https://sproutsquad.app/privacy')} />
        <Divider />
        <Row label="Support" onPress={() => Linking.openURL('https://sproutsquad.app/support')} />
      </Card>
      <View style={{ gap: 12 }}>
        <Button label="Sign out" variant="ghost" onPress={() => signOut()} />
        <DeleteAccount />
      </View>
      <Body style={{ fontSize: 12, color: c.ink3, textAlign: 'center' }}>Sprout Squad beta</Body>
    </DetailScreen>
  );
}

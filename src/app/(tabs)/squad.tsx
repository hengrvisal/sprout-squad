import { Screen } from '@/components/Screen';
import { Body, Card, Eyebrow, H } from '@/components/ui';
import { useColors } from '@/theme/tokens';

export default function Squad() {
  const c = useColors();
  return (
    <Screen>
      <Card bg={c.lilac}>
        <Eyebrow style={{ color: c.tangInk }}>Coming in phase 2</Eyebrow>
        <H style={{ color: c.tangInk }}>Your squad lives here</H>
        <Body style={{ color: c.tangInk }}>
          Invite friends with a code, see their monthly grids and today’s wins, and send kudos. No rankings, no leaderboard.
        </Body>
      </Card>
    </Screen>
  );
}

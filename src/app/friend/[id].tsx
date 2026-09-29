import { useLocalSearchParams } from 'expo-router';
import { DetailScreen } from '@/components/Screen';
import { MemberCard } from '@/components/squad/MemberCard';
import { Body } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { useSquads } from '@/hooks/squads';
import { useColors } from '@/theme/tokens';

/** One squadmate: their month, what they did today, and kudos. */
export default function Friend() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { members, toggleKudo } = useSquads();
  const me = session?.user.id;
  const f = members.find((m) => m.id === id);

  return (
    <DetailScreen title={f ? (f.id === me ? 'You' : f.display_name || 'Someone') : 'Friend'}>
      {f ? (
        <MemberCard member={f} isMe={f.id === me} myId={me} onKudo={(e) => toggleKudo(f.id, e).catch(() => {})} />
      ) : (
        <Body style={{ color: c.ink3 }}>This person isn’t in the squad any more.</Body>
      )}
    </DetailScreen>
  );
}

import { Text, View } from 'react-native';
import { DetailScreen } from '@/components/Screen';
import { PlantCard } from '@/components/squad/PlantCard';
import { Body, Card, Eyebrow } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { useSquads } from '@/hooks/squads';
import { fonts, useColors } from '@/theme/tokens';

const HOW = [
  ['🌱', 'Log something', 'Your first win each day counts most. A few more help a little. Quality over quantity.'],
  ['👥', 'Show up together', 'The more of the squad who log on the same day, the faster it grows. Everyone on one day is a full squad day.'],
  ['🔥', 'Cheer each other on', 'Kudos from squadmates add a little growth too.'],
  ['🎯', 'Hit the weekly goal', 'A shared goal every Monday. Hit it for a 20% growth spurt.'],
  ['💧', 'It never dies', 'If nobody logs for a few days it gets thirsty. One log perks it back up.'],
] as const;

export default function PlantScreen() {
  const c = useColors();
  const { session } = useAuth();
  const { selected, members, plant } = useSquads();

  return (
    <DetailScreen title={selected ? `${selected.name}’s plant` : 'Squad plant'}>
      {plant && selected ? (
        <PlantCard plant={plant} squadId={selected.id} members={members} me={session?.user.id} />
      ) : (
        <Body style={{ color: c.ink3 }}>Loading the plant…</Body>
      )}
      <Card style={{ gap: 12 }}>
        <Eyebrow>How it grows</Eyebrow>
        {HOW.map(([icon, title, body]) => (
          <View key={title} style={{ flexDirection: 'row', gap: 12 }}>
            <Text style={{ fontSize: 20, width: 26 }}>{icon}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.ink }}>{title}</Text>
              <Body style={{ fontSize: 13.5, color: c.ink2 }}>{body}</Body>
            </View>
          </View>
        ))}
      </Card>
    </DetailScreen>
  );
}

import { Text, View } from 'react-native';
import { Body, Card, Dot, Eyebrow, H, Mono } from '@/components/ui';
import type { Member } from '@/hooks/squads';
import { healthLabel, MEMBER_COLORS, PlantData, stageFor } from '@/lib/plant';
import { fonts, radius, useColors } from '@/theme/tokens';
import { Plant } from './Plant';

function Bar({ value, color }: { value: number; color: string }) {
  const c = useColors();
  return (
    <View style={{ height: 12, borderRadius: 6, borderWidth: 2, borderColor: c.line, backgroundColor: c.soft, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

/** The squad plant plus this week's shared goal. */
export function PlantCard({ plant, squadId, members, me }: { plant: PlantData; squadId: string; members: Member[]; me?: string }) {
  const c = useColors();
  const stage = stageFor(plant.growth);
  const health = healthLabel(plant.health, plant.drooping);
  const toneColor = health.tone === 'good' ? c.grid[3] : health.tone === 'ok' ? c.sky : c.tang;
  const names = new Map(members.map((m) => [m.id, m.id === me ? 'You' : m.display_name || 'Someone']));
  const w = plant.week;

  return (
    <>
      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Eyebrow>Squad plant</Eyebrow>
            <H size={24}>{stage.name}</H>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: c.card }}>
            <Dot color={toneColor} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.ink }}>{health.label}</Text>
          </View>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Plant
            stage={stage.index}
            progress={stage.progress}
            health={plant.health}
            drooping={plant.drooping}
            members={plant.members}
            seedKey={squadId}
            size={210}
          />
        </View>

        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink2 }}>
              {stage.next ? `${stage.next.in} growth to ${stage.next.name}` : 'Fully grown 🌳'}
            </Text>
            <Mono style={{ fontSize: 13, color: c.ink3 }}>{plant.growth}</Mono>
          </View>
          <Bar value={stage.progress} color={c.grid[3]} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Body style={{ fontSize: 13.5, color: c.ink2 }}>
            Today <Mono style={{ fontSize: 13.5 }}>{plant.today.active}/{plant.today.members}</Mono> showed up
            {plant.today.points > 0 ? ' · ' : ''}
            {plant.today.points > 0 && <Mono style={{ fontSize: 13.5, color: c.grid[4] }}>+{plant.today.points}</Mono>}
          </Body>
          {plant.today.full && (
            <View style={{ borderWidth: 2, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1, backgroundColor: '#FFE45C' }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: '#131B33', letterSpacing: 0.4 }}>✨ FULL SQUAD DAY</Text>
            </View>
          )}
        </View>

        {plant.members.length > 1 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} accessibilityLabel="Leaf colours by member">
            {plant.members.map((m, i) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Dot color={MEMBER_COLORS[i % MEMBER_COLORS.length]} />
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: c.ink3 }}>{names.get(m.id) ?? 'Someone'}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {w?.label && (
        <Card bg={w.met ? c.grid[1] : undefined} style={{ gap: 10 }}>
          <Eyebrow style={w.met ? { color: c.ink } : undefined}>This week’s goal</Eyebrow>
          <H size={18} style={w.met ? { color: c.ink } : undefined}>
            {w.label}
          </H>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Bar value={w.progress / Math.max(1, w.target)} color={w.met ? c.grid[4] : c.lilac} />
            </View>
            <Mono style={{ fontSize: 13, color: w.met ? c.ink : c.ink }}>
              {w.progress}/{w.target}
            </Mono>
          </View>
          <Body style={{ fontSize: 13, color: w.met ? c.ink : c.ink2 }}>
            {w.met ? `Goal hit! Growth spurt +${w.bonus} 🌱` : 'Hit it together for a 20% growth spurt this week. New goal every Monday.'}
          </Body>
        </Card>
      )}
    </>
  );
}

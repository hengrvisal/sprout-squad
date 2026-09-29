import { Text, View } from 'react-native';
import { MonthGrid } from '@/components/MonthGrid';
import { Avatar } from '@/components/Screen';
import { Body, Card, Dot, Mono } from '@/components/ui';
import type { Member } from '@/hooks/squads';
import { categoryColor } from '@/lib/categories';
import { monthAt, streak } from '@/lib/dates';
import { fonts, radius, useColors } from '@/theme/tokens';

const SHOW = 4;

export function MemberCard({ member, isMe }: { member: Member; isMe?: boolean }) {
  const c = useColors();
  const { y, m } = monthAt(0);
  const st = streak(member.counts);
  const name = isMe ? 'You' : member.display_name || 'Someone';

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar emoji={member.emoji} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: c.ink }} numberOfLines={1}>
            {name}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: c.ink2 }}>
            <Mono style={{ fontSize: 13 }}>{member.today.length}</Mono> today · <Mono style={{ fontSize: 13 }}>{st}d</Mono> streak
          </Text>
        </View>
        {st >= 7 && (
          <View style={{ borderWidth: 2, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1, backgroundColor: c.tang }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.6, color: c.tangInk }}>ON A ROLL</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
        <View style={{ width: 132 }}>
          <MonthGrid y={y} m={m} counts={member.counts} mini gap={3} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          {member.today.length === 0 ? (
            <Body style={{ fontSize: 13.5, color: c.ink3 }}>Quiet day so far.</Body>
          ) : (
            <>
              {member.today.slice(0, SHOW).map((e) => (
                <View key={e.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <View style={{ paddingTop: 5 }}>
                    <Dot color={categoryColor(e.category)} size={9} />
                  </View>
                  <Body style={{ flex: 1, fontSize: 13.5, lineHeight: 19, color: c.ink2 }}>{e.text}</Body>
                </View>
              ))}
              {member.today.length > SHOW && (
                <Body style={{ fontSize: 13, color: c.ink3 }}>+{member.today.length - SHOW} more</Body>
              )}
            </>
          )}
        </View>
      </View>
    </Card>
  );
}

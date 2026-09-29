import { Pressable, Text, View } from 'react-native';
import { MonthGrid } from '@/components/MonthGrid';
import { Avatar } from '@/components/Screen';
import { Body, Card, Dot, Mono } from '@/components/ui';
import type { Member } from '@/hooks/squads';
import { categoryColor } from '@/lib/categories';
import { monthAt, streak } from '@/lib/dates';
import { KUDOS, KudoEmoji } from '@/lib/kudos';
import { fonts, radius, useColors } from '@/theme/tokens';

const SHOW = 4;

export function MemberCard({
  member,
  isMe,
  myId,
  onKudo,
}: {
  member: Member;
  isMe?: boolean;
  /** Your user id, to show which kudos you've already sent. */
  myId?: string;
  onKudo?: (emoji: KudoEmoji) => void;
}) {
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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityLabel={isMe ? 'Kudos you got today' : `Send ${name} kudos`}>
        {KUDOS.map((e) => {
          const n = member.kudos.filter((k) => k.emoji === e).length;
          const mine = !!myId && member.kudos.some((k) => k.from === myId && k.emoji === e);
          if (isMe && n === 0) return null;
          return (
            <Pressable
              key={e}
              disabled={isMe}
              onPress={() => onKudo?.(e)}
              accessibilityRole={isMe ? undefined : 'button'}
              accessibilityState={isMe ? undefined : { selected: mine }}
              accessibilityLabel={`${e} ${n}`}
              hitSlop={4}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                borderWidth: 2,
                borderColor: c.line,
                borderRadius: radius.pill,
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: mine ? c.lilac : c.card,
                transform: pressed ? [{ scale: 0.94 }] : [],
              })}
            >
              <Text style={{ fontSize: 16 }}>{e}</Text>
              {n > 0 && <Mono style={{ fontSize: 12, color: mine ? c.tangInk : c.ink }}>{n}</Mono>}
            </Pressable>
          );
        })}
        {isMe && member.kudos.length === 0 && <Body style={{ fontSize: 13, color: c.ink3 }}>No kudos yet today.</Body>}
      </View>
    </Card>
  );
}

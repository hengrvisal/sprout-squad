import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DayCounts, lastDays, longestStreak, streak, WEEKDAYS } from '@/lib/dates';
import { fonts, radius, softShadow, useColors } from '@/theme/tokens';

function message(st: number, best: number, loggedToday: boolean) {
  if (st === 0) return 'Log one thing today to start a streak.';
  if (!loggedToday) return `Log something today to keep your ${st}-day streak alive.`;
  if (st >= best && st > 1) return 'This is your longest streak ever. Keep going!';
  if (best - st <= 3) return `${best - st + 1} more ${best - st + 1 === 1 ? 'day' : 'days'} to beat your best.`;
  return 'Today counts. See you tomorrow.';
}

/** Tap the 🔥: your streak, your best, and the last 7 days. */
export function StreakSheet({ open, onClose, counts }: { open: boolean; onClose: () => void; counts: DayCounts }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [v] = useState(() => new Animated.Value(0));
  const [flame] = useState(() => new Animated.Value(0));
  const st = streak(counts);
  const best = Math.max(longestStreak(counts), st);
  const week = lastDays(counts, 7);
  const loggedToday = week[6].count > 0;

  useEffect(() => {
    if (!open) return;
    v.setValue(0);
    Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flame, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flame, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [open, v, flame]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(10,16,12,0.35)', justifyContent: 'flex-start', paddingTop: insets.top + 64, paddingHorizontal: 20 }}>
        <Animated.View
          style={[
            { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] },
          ]}
        >
          <Pressable onPress={() => {}} style={[{ backgroundColor: c.card, borderRadius: 28, padding: 22, gap: 18, alignItems: 'center' }, softShadow(c, 3)]}>
            <Animated.Text
              style={{
                fontSize: 54,
                opacity: st ? 1 : 0.35,
                transform: [
                  { scale: flame.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
                  { rotate: flame.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) },
                ],
              }}
            >
              🔥
            </Animated.Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: c.ink }}>{st}</Text>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: c.ink2 }}>day streak</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {week.map((d, i) => (
                <View key={d.key} style={{ alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: d.count ? c.tang : c.soft,
                      borderWidth: i === 6 ? 2 : 0,
                      borderColor: d.count ? c.tang : c.ink3,
                      borderStyle: d.count ? 'solid' : 'dashed',
                    }}
                  >
                    {d.count > 0 && <Text style={{ fontSize: 15 }}>🔥</Text>}
                  </View>
                  <Text style={{ fontFamily: i === 6 ? fonts.bodyBold : fonts.bodySemi, fontSize: 11, color: i === 6 ? c.ink : c.ink3 }}>
                    {i === 6 ? 'Today' : WEEKDAYS[d.weekday]}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 21, color: c.ink, textAlign: 'center' }}>{message(st, best, loggedToday)}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ backgroundColor: c.soft, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink2 }}>🏆 Best: {best} {best === 1 ? 'day' : 'days'}</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

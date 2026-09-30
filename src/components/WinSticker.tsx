import { ReactNode, useEffect, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { categoryColor, categoryEmoji } from '@/lib/categories';
import { fonts, radius } from '@/theme/tokens';

const INK = '#131B33'; // text on the bright category colours, same in light and dark

/** A logged win as a colourful sticker, slightly tilted. Pops in when it mounts. */
export function WinSticker({ text, category, i = 0, right }: { text: string; category: string; i?: number; right?: ReactNode }) {
  const [pop] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 12, delay: Math.min(i, 6) * 40 }).start();
  }, [pop, i]);
  const tilt = ['-1.2deg', '0.8deg', '-0.4deg', '1.1deg'][i % 4];
  return (
    <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }, { rotate: tilt }], opacity: pop }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: categoryColor(category),
          borderWidth: 2,
          borderColor: INK,
          borderRadius: radius.md,
          paddingVertical: 9,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ fontSize: 18 }}>{categoryEmoji(category)}</Text>
        <Text numberOfLines={right ? 2 : 1} style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: INK }}>
          {text}
        </Text>
        {right ?? <Text style={{ fontSize: 14, color: INK }}>✓</Text>}
      </View>
    </Animated.View>
  );
}

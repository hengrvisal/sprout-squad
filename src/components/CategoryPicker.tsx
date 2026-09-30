import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';
import { CATEGORIES, CategoryKey } from '@/lib/categories';
import { fonts, radius, useColors } from '@/theme/tokens';

/**
 * Pick a category. `grid`: colourful emoji + label pills, three per row.
 * `compact`: a row of emoji bubbles (for tight spots like the focus timer).
 */
export function CategoryPicker({
  value,
  onChange,
  compact = false,
}: {
  value: CategoryKey;
  onChange: (k: CategoryKey) => void;
  compact?: boolean;
}) {
  const c = useColors();
  const pick = (k: CategoryKey) => {
    if (k !== value) Haptics.selectionAsync().catch(() => {});
    onChange(k);
  };

  if (compact) {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityRole="radiogroup">
        {CATEGORIES.map((k) => {
          const on = k.key === value;
          return (
            <Pressable
              key={k.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={k.label}
              onPress={() => pick(k.key)}
              hitSlop={4}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                borderWidth: 2,
                borderColor: on ? c.line : 'transparent',
                backgroundColor: on ? k.color : c.soft,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: on ? 1.08 : 1 }],
              }}
            >
              <Text style={{ fontSize: 19, opacity: on ? 1 : 0.75 }}>{k.emoji}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup">
      {CATEGORIES.map((k) => {
        const on = k.key === value;
        return (
          <Pressable
            key={k.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={k.label}
            onPress={() => pick(k.key)}
            style={({ pressed }) => ({
              flexGrow: 1,
              flexBasis: '30%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 8,
              borderRadius: radius.pill,
              borderWidth: 2,
              borderColor: on ? c.line : c.soft,
              backgroundColor: on ? k.color : c.card,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 15 }}>{k.emoji}</Text>
            <Text style={{ fontFamily: on ? fonts.bodyBold : fonts.bodySemi, fontSize: 13.5, color: on ? '#131B33' : c.ink2 }}>{k.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

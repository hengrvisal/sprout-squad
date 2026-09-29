import { Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ComponentProps, useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, fonts, useColors } from '@/theme/tokens';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const LABELS: Record<string, string> = { index: 'Today', squad: 'Squad', me: 'Me' };

const ICONS: Record<string, string> = { index: '✏️', squad: '🌱', me: '🙂' };

/**
 * Floating pill tab bar. A green highlight springs between tabs, the active tab grows a
 * little and shows its icon, and there's a light haptic tick on press.
 */
function PillTabBar({ state, navigation }: TabBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [x] = useState(() => new Animated.Value(state.index));
  const PAD = 6;
  const GAP = 6;
  const n = state.routes.length;
  const tabW = width ? (width - PAD * 2 - GAP * (n - 1)) / n : 0;

  useEffect(() => {
    Animated.spring(x, { toValue: state.index, useNativeDriver: true, speed: 16, bounciness: 9 }).start();
  }, [state.index, x]);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        // sit close to the bottom edge, just clear of the home indicator
        bottom: Math.max(insets.bottom - 12, 10),
        flexDirection: 'row',
        gap: GAP,
        padding: PAD,
        backgroundColor: c.ink,
        borderRadius: 26,
        borderWidth: border,
        borderColor: c.line,
      }}
    >
      {tabW > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: PAD,
            bottom: PAD,
            left: PAD,
            width: tabW,
            borderRadius: 20,
            backgroundColor: c.grid[3],
            transform: [{ translateX: x.interpolate({ inputRange: [0, Math.max(1, n - 1)], outputRange: [0, (tabW + GAP) * Math.max(1, n - 1)] }) }],
          }}
        />
      )}
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={LABELS[route.name] ?? route.name}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate(route.name);
              }
            }}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              opacity: pressed && !focused ? 0.6 : 1,
            })}
          >
            {focused && <Text style={{ fontSize: 14 }}>{ICONS[route.name]}</Text>}
            <Text style={{ fontFamily: fonts.displayBold, fontSize: focused ? 16 : 15, color: focused ? c.onGreen : c.screen, opacity: focused ? 1 : 0.7 }}>
              {LABELS[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.screen } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="squad" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}

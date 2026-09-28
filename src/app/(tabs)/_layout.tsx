import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, fonts, useColors } from '@/theme/tokens';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const LABELS: Record<string, string> = { index: 'Today', squad: 'Squad', me: 'Me' };

/** Floating pill tab bar from the prototype. */
function PillTabBar({ state, navigation }: TabBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12 + insets.bottom,
        flexDirection: 'row',
        gap: 6,
        padding: 6,
        backgroundColor: c.ink,
        borderRadius: 22,
        borderWidth: border,
        borderColor: c.line,
      }}
    >
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 16,
              alignItems: 'center',
              backgroundColor: focused ? c.grid[3] : 'transparent',
            }}
          >
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 15, color: focused ? c.onGreen : c.screen, opacity: focused ? 1 : 0.7 }}>
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

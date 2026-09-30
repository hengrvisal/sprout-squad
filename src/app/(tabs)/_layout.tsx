import { Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ComponentProps, useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/Icon';
import { useNotificationResponses } from '@/hooks/notifications';
import { fonts, softShadow, useColors } from '@/theme/tokens';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const LABELS: Record<string, string> = { index: 'Today', month: 'Month', focus: 'Focus', squad: 'Squad', me: 'Me' };

/**
 * Frosted floating tab bar: five icons, a soft highlight glides to the active one.
 * Swipe left/right on any page to move between them too.
 */
function TabBar({ state, navigation }: TabBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [x] = useState(() => new Animated.Value(state.index));
  const PAD = 6;
  const n = state.routes.length;
  const tabW = width ? (width - PAD * 2) / n : 0;

  useEffect(() => {
    Animated.spring(x, { toValue: state.index, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
  }, [state.index, x]);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[
        {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: Math.max(insets.bottom - 8, 12),
          flexDirection: 'row',
          padding: PAD,
          backgroundColor: c.glassStrong,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: c.line,
        },
        softShadow(c, 1.6),
      ]}
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
            borderRadius: 22,
            backgroundColor: c.ink,
            transform: [{ translateX: x.interpolate({ inputRange: [0, n - 1], outputRange: [0, tabW * (n - 1)] }) }],
          }}
        />
      )}
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const label = LABELS[route.name] ?? route.name;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate(route.name);
              }
            }}
            style={{ flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', gap: 2 }}
          >
            <Icon name={route.name === 'index' ? 'today' : (route.name as IconName)} size={21} color={focused ? c.screen : c.ink3} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: focused ? c.screen : c.ink3 }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  useNotificationResponses();
  const c = useColors();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      // 'shift' slides pages sideways, so tapping or swiping tabs feels like one strip of pages
      screenOptions={{ headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: c.screen } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="month" />
      <Tabs.Screen name="focus" />
      <Tabs.Screen name="squad" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}

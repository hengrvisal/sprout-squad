import * as Haptics from 'expo-haptics';
import { router, useNavigation } from 'expo-router';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, PanResponder, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useColors } from '@/theme/tokens';

type TabNav = { getState: () => { index: number; routes: { name: string }[] }; navigate: (name: string) => void };

/**
 * Swipe left/right to move between tabs. The page follows your finger a little (with a
 * rubber band at the ends), then the tab bar's shift animation takes over.
 */
function useTabSwipe() {
  const navigation = useNavigation() as unknown as TabNav;
  const nav = useRef(navigation);
  useEffect(() => {
    nav.current = navigation;
  }, [navigation]);
  const [drag] = useState(() => new Animated.Value(0));
  // the ref is only read inside gesture callbacks, never during render
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() => {
    const neighbour = (dir: 1 | -1) => {
      try {
        const st = nav.current.getState();
        return st.routes[st.index + dir]?.name ?? null;
      } catch {
        return null;
      }
    };
    const settle = () => Animated.spring(drag, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
    return PanResponder.create({
      // only claim clearly horizontal drags, so vertical scrolling is untouched
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderMove: (_, g) => {
        const dir = g.dx < 0 ? 1 : -1;
        const free = neighbour(dir) ? 0.35 : 0.12;
        drag.setValue(g.dx * free);
      },
      onPanResponderRelease: (_, g) => {
        const dir = g.dx < 0 ? 1 : -1;
        const target = neighbour(dir);
        if (target && (Math.abs(g.dx) > 70 || Math.abs(g.vx) > 0.45)) {
          Haptics.selectionAsync().catch(() => {});
          nav.current.navigate(target);
        }
        settle();
      },
      onPanResponderTerminate: settle,
      onPanResponderTerminationRequest: () => true,
    });
  });
  return { drag, handlers: pan.panHandlers };
}

/**
 * A tab screen: big title, optional subtitle and right-hand action, then content.
 * Designed so the main content fits one phone screen; details live one tap away.
 */
export function Screen({
  title,
  subtitle,
  right,
  titleNode,
  children,
  refreshing,
  onRefresh,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  /** Replaces the title text (e.g. a squad switcher). */
  titleNode?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const swipe = useTabSwipe();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.screen }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View {...swipe.handlers} style={{ flex: 1, transform: [{ translateX: swipe.drag }] }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.ink} /> : undefined}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 18, paddingBottom: insets.bottom + 90, gap: 18 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, minHeight: 56 }}>
          <View style={{ flex: 1 }}>
            {subtitle ? (
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: c.ink3 }}>{subtitle}</Text>
            ) : null}
            {titleNode ?? <Text style={{ fontFamily: fonts.display, fontSize: 32, color: c.ink, letterSpacing: -0.8 }}>{title}</Text>}
          </View>
          {right}
        </View>
        {children}
      </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

/** A pushed detail screen: back button + title, scrollable content. */
export function DetailScreen({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.screen }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.mono, fontSize: 26, color: c.ink }}>‹</Text>
        </Pressable>
        <Text style={{ flex: 1, fontFamily: fonts.displayBold, fontSize: 20, color: c.ink }} numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: insets.bottom + 40, gap: 16 }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Avatar({ emoji, size = 34 }: { emoji?: string; size?: number }) {
  const c = useColors();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: c.lilac,
        borderWidth: 2.5,
        borderColor: c.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji || '🌱'}</Text>
    </View>
  );
}

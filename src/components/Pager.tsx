import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/Icon';
import { FocusPage } from '@/components/pages/FocusPage';
import { MePage } from '@/components/pages/MePage';
import { MonthPage } from '@/components/pages/MonthPage';
import { SquadPage } from '@/components/pages/SquadPage';
import { TodayPage } from '@/components/pages/TodayPage';
import { useNotificationResponses } from '@/hooks/notifications';
import { PAGES, PageName, usePager } from '@/hooks/pager';
import { fonts, softShadow, useColors } from '@/theme/tokens';

const LABELS: Record<PageName, string> = { today: 'Today', month: 'Month', focus: 'Focus', squad: 'Squad', me: 'Me' };
const ICONS: Record<PageName, IconName> = { today: 'today', month: 'month', focus: 'focus', squad: 'squad', me: 'me' };

/** Frosted tab bar. The highlight follows the pager as you swipe, not after. */
function TabBar() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { index, scrollX, goTo, bind } = usePager();
  const { width: screenW } = useWindowDimensions();
  const [barW, setBarW] = useState(0);
  const PAD = 6;
  const n = PAGES.length;
  const tabW = barW ? (barW - PAD * 2) / n : 0;

  return (
    <View
      onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
      style={[
        { position: 'absolute', left: 20, right: 20, bottom: Math.max(insets.bottom - 8, 12), flexDirection: 'row', padding: PAD, backgroundColor: c.glassStrong, borderRadius: 28, borderWidth: 1, borderColor: c.line },
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
            transform: [
              {
                translateX: scrollX.interpolate({
                  inputRange: [0, screenW * (n - 1)],
                  outputRange: [0, tabW * (n - 1)],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}
        />
      )}
      {PAGES.map((p, i) => {
        const on = index === i;
        return (
          <Pressable
            key={p}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={LABELS[p]}
            onPress={() => {
              if (on) return;
              Haptics.selectionAsync().catch(() => {});
              // a far jump without animation feels snappier than flying past every page
              goTo(i, Math.abs(i - index) <= 1);
              bind.setIndex(i);
            }}
            style={{ flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', gap: 2 }}
          >
            <Icon name={ICONS[p]} size={21} color={on ? c.screen : c.ink3} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: on ? c.screen : c.ink3 }}>{LABELS[p]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * The five main pages side by side in one native paging scroll view, so swiping is
 * finger-tracked and smooth. Pages stay mounted; `active` tells a page when it's on screen.
 */
export function Pager() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const { index, scrollX, locked, bind, goTo } = usePager();
  const { attach, setIndex, setWidth } = bind;
  useNotificationResponses();

  // keep the offset right on rotation / first layout, and honour a goTo() made before mount
  useEffect(() => {
    setWidth(width);
    goTo(index, false);
    // only when the width changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: true,
    listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
      if (i !== index && i >= 0 && i < PAGES.length) {
        setIndex(i);
        Haptics.selectionAsync().catch(() => {});
      }
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.screen }}>
      <Animated.ScrollView
        ref={attach}
        horizontal
        pagingEnabled
        scrollEnabled={!locked}
        bounces={false}
        overScrollMode="never"
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={onScroll}
      >
        {PAGES.map((p, i) => (
          <View key={p} style={{ width, flex: 1 }}>
            {p === 'today' && <TodayPage active={index === i} />}
            {p === 'month' && <MonthPage active={index === i} />}
            {p === 'focus' && <FocusPage active={index === i} />}
            {p === 'squad' && <SquadPage active={index === i} />}
            {p === 'me' && <MePage active={index === i} />}
          </View>
        ))}
      </Animated.ScrollView>
      <TabBar />
    </View>
  );
}

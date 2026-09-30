import { router } from 'expo-router';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Backdrop } from '@/components/Backdrop';
import { fonts, GradientName, useColors } from '@/theme/tokens';

/**
 * A main page (one of the five in the pager): big title, optional subtitle and right-hand action, then content.
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
  gradient = 'today',
  scroll = true,
}: {
  /** Which page gradient to paint behind the content. */
  gradient?: GradientName;
  /** Pages built to fit one screen can turn scrolling off. */
  scroll?: boolean;
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
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.screen }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Backdrop name={gradient} />
      <View style={{ flex: 1 }}>
        <ScrollView
          scrollEnabled={scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.ink} /> : undefined}
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: insets.bottom + 96, gap: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 52 }}>
            <View style={{ flex: 1 }}>
              {subtitle ? <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.ink3 }}>{subtitle}</Text> : null}
              {titleNode ?? <Text style={{ fontFamily: fonts.display, fontSize: 30, color: c.ink, letterSpacing: -0.8 }}>{title}</Text>}
            </View>
            {right}
          </View>
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

/** A pushed detail screen: back button + title, scrollable content. */
export function DetailScreen({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.screen }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Backdrop name="detail" />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 30, lineHeight: 32, color: c.ink }}>‹</Text>
        </Pressable>
        <Text style={{ flex: 1, fontFamily: fonts.displayBold, fontSize: 20, color: c.ink }} numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 40, gap: 16 }}
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
        backgroundColor: c.glassStrong,
        borderWidth: 1,
        borderColor: c.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji || '🌱'}</Text>
    </View>
  );
}

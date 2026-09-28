import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '@/hooks/profile';
import { fonts, radius, useColors } from '@/theme/tokens';
import { Chunky } from './ui';

/** Scrollable tab screen with the Sprout Squad header. */
export function Screen({ children }: { children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.screen }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 16, paddingBottom: insets.bottom + 110, gap: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: c.grid[3], borderWidth: 2.5, borderColor: c.line, transform: [{ rotate: '8deg' }] }}
            />
            <Text style={{ fontFamily: fonts.display, fontSize: 24, color: c.ink, letterSpacing: -0.5 }}>Sprout Squad</Text>
          </View>
          <Chunky r={radius.pill} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 3, paddingRight: 12 }}>
            <Avatar emoji={profile?.emoji} size={28} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.ink }}>{profile?.display_name || 'You'}</Text>
          </Chunky>
        </View>
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

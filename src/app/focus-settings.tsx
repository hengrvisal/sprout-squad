import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { DetailScreen } from '@/components/Screen';
import { Chunky, Divider } from '@/components/ui';
import { useFocus } from '@/hooks/focus';
import { clampSetting, FocusSettings, LIMITS } from '@/lib/pomodoro';
import { fonts, radius, useColors } from '@/theme/tokens';

type NumKey = 'focus' | 'short' | 'long' | 'rounds';

const PRESETS: { label: string; hint: string; v: Pick<FocusSettings, NumKey> }[] = [
  { label: 'Classic', hint: '25 / 5', v: { focus: 25, short: 5, long: 15, rounds: 4 } },
  { label: 'Deep', hint: '50 / 10', v: { focus: 50, short: 10, long: 20, rounds: 3 } },
  { label: 'Quick', hint: '15 / 3', v: { focus: 15, short: 3, long: 10, rounds: 4 } },
];

function Stepper({ label, k, unit }: { label: string; k: NumKey; unit: string }) {
  const c = useColors();
  const { settings, updateSettings } = useFocus();
  const step = LIMITS[k][2];
  const v = settings[k];
  const set = (n: number) => {
    const next = clampSetting(k, n);
    if (next !== v) Haptics.selectionAsync().catch(() => {});
    updateSettings({ [k]: next });
  };
  const btn = (txt: string, n: number, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={() => set(n)}
      hitSlop={8}
      style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}
    >
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 20, lineHeight: 22, color: c.ink }}>{txt}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 }}>
      <Text style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 16, color: c.ink }}>{label}</Text>
      {btn('−', v - step, `Less ${label}`)}
      <Text style={{ width: 64, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 16, color: c.ink }} accessibilityLabel={`${label}: ${v} ${unit}`}>
        {v} <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.ink3 }}>{unit}</Text>
      </Text>
      {btn('+', v + step, `More ${label}`)}
    </View>
  );
}

/** Pick a rhythm. Custom opens the individual lengths. */
export default function FocusSettingsScreen() {
  const c = useColors();
  const { settings, updateSettings } = useFocus();
  const match = PRESETS.find((p) => (Object.keys(p.v) as NumKey[]).every((k) => p.v[k] === settings[k]));
  const [custom, setCustom] = useState(!match);
  const choice = custom ? 'Custom' : (match?.label ?? 'Custom');

  const pill = (label: string, hint: string, on: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 12, borderRadius: radius.md, backgroundColor: on ? c.ink : 'transparent' }}
    >
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14.5, color: on ? c.screen : c.ink }}>{label}</Text>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: on ? c.screen : c.ink3, opacity: on ? 0.8 : 1 }}>{hint}</Text>
    </Pressable>
  );

  return (
    <DetailScreen title="Timer">
      <Chunky style={{ flexDirection: 'row', padding: 5, gap: 4 }}>
        {PRESETS.map((p) =>
          pill(p.label, p.hint, choice === p.label, () => {
            setCustom(false);
            updateSettings(p.v);
          }),
        )}
        {pill('Custom', 'your way', choice === 'Custom', () => setCustom(true))}
      </Chunky>

      {choice === 'Custom' && (
        <Chunky style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
          <Stepper label="Focus" k="focus" unit="min" />
          <Divider />
          <Stepper label="Short break" k="short" unit="min" />
          <Divider />
          <Stepper label="Long break" k="long" unit="min" />
          <Divider />
          <Stepper label="Rounds" k="rounds" unit="" />
        </Chunky>
      )}

      <Chunky style={{ paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 16, color: c.ink }}>Start breaks automatically</Text>
        <Switch
          value={settings.autoBreaks}
          onValueChange={(v) => updateSettings({ autoBreaks: v })}
          trackColor={{ true: c.accent, false: c.soft }}
          accessibilityLabel="Start breaks automatically"
        />
      </Chunky>
    </DetailScreen>
  );
}

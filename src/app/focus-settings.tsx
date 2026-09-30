import * as Haptics from 'expo-haptics';
import { Pressable, Switch, Text, View } from 'react-native';
import { DetailScreen } from '@/components/Screen';
import { Body, Button, Card, Divider, Eyebrow } from '@/components/ui';
import { useFocus } from '@/hooks/focus';
import { clampSetting, DEFAULT_SETTINGS, FocusSettings, LIMITS } from '@/lib/pomodoro';
import { border, fonts, useColors } from '@/theme/tokens';

type NumKey = 'focus' | 'short' | 'long' | 'rounds';

const PRESETS: { label: string; hint: string; v: Pick<FocusSettings, NumKey> }[] = [
  { label: 'Classic', hint: '25 · 5 · 15', v: { focus: 25, short: 5, long: 15, rounds: 4 } },
  { label: 'Deep work', hint: '50 · 10 · 20', v: { focus: 50, short: 10, long: 20, rounds: 3 } },
  { label: 'Quick', hint: '15 · 3 · 10', v: { focus: 15, short: 3, long: 10, rounds: 4 } },
];

function Stepper({ label, k, unit }: { label: string; k: NumKey; unit: string }) {
  const c = useColors();
  const { settings, updateSettings } = useFocus();
  const [, , step] = LIMITS[k];
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
      hitSlop={6}
      style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 12, borderWidth: 2, borderColor: c.line, backgroundColor: pressed ? c.soft : c.card, alignItems: 'center', justifyContent: 'center' })}
    >
      <Text style={{ fontFamily: fonts.mono, fontSize: 20, color: c.ink }}>{txt}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 }}>
      <Text style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 16, color: c.ink }}>{label}</Text>
      {btn('−', v - step, `Less ${label}`)}
      <Text style={{ minWidth: 74, textAlign: 'center', fontFamily: fonts.mono, fontSize: 17, color: c.ink }} accessibilityLabel={`${label}: ${v} ${unit}`}>
        {v} <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.ink3 }}>{unit}</Text>
      </Text>
      {btn('+', v + step, `More ${label}`)}
    </View>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: c.ink }}>{label}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.ink3 }}>{hint}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.grid[3], false: c.soft }} accessibilityLabel={label} />
    </View>
  );
}

/** Timer lengths, rounds before a long break, auto-start. Saved on this phone. */
export default function FocusSettingsScreen() {
  const c = useColors();
  const { settings, updateSettings } = useFocus();
  const activePreset = PRESETS.find((p) => (Object.keys(p.v) as NumKey[]).every((k) => p.v[k] === settings[k]));

  return (
    <DetailScreen title="Timer settings">
      <Card style={{ gap: 10 }}>
        <Eyebrow>Presets</Eyebrow>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {PRESETS.map((p) => {
            const on = activePreset === p;
            return (
              <Pressable
                key={p.label}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => updateSettings(p.v)}
                style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, borderRadius: 14, borderWidth: border, borderColor: c.line, backgroundColor: on ? c.tang : c.card }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: on ? '#131B33' : c.ink }}>{p.label}</Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: on ? '#131B33' : c.ink3 }}>{p.hint}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ gap: 0, paddingVertical: 6 }}>
        <Stepper label="Focus" k="focus" unit="min" />
        <Divider />
        <Stepper label="Short break" k="short" unit="min" />
        <Divider />
        <Stepper label="Long break" k="long" unit="min" />
        <Divider />
        <Stepper label="Long break every" k="rounds" unit="rounds" />
      </Card>

      <Card style={{ gap: 0, paddingVertical: 6 }}>
        <Toggle label="Auto-start breaks" hint="Roll straight into your break when a round ends." value={settings.autoBreaks} onChange={(v) => updateSettings({ autoBreaks: v })} />
        <Divider />
        <Toggle label="Auto-start focus" hint="Start the next round when a break ends." value={settings.autoFocus} onChange={(v) => updateSettings({ autoFocus: v })} />
      </Card>

      <Body style={{ fontSize: 13, color: c.ink3 }}>
        With notifications on, you’ll get a ping when a round or break ends, even if the app is closed.
      </Body>
      <Button label="Back to defaults" variant="ghost" onPress={() => updateSettings(DEFAULT_SETTINGS)} />
    </DetailScreen>
  );
}

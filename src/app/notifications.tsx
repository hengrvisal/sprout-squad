import { Linking, Platform, Switch, Text, View } from 'react-native';
import { DetailScreen } from '@/components/Screen';
import { Body, Button, Card, Chip, Divider, Eyebrow } from '@/components/ui';
import { useNotifications } from '@/hooks/notifications';
import { hourLabel, REMINDER_HOURS } from '@/lib/reminders';
import { fonts, useColors } from '@/theme/tokens';

function Toggle({ label, detail, value, onChange, disabled }: { label: string; detail: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, opacity: disabled ? 0.5 : 1 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: c.ink }}>{label}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.ink3 }}>{detail}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ true: c.grid[3], false: c.soft }}
        thumbColor={Platform.OS === 'android' ? c.card : undefined}
      />
    </View>
  );
}

/** Which pushes you get. Nothing here is on unless the phone allows notifications. */
export default function NotificationSettings() {
  const c = useColors();
  const { permission, enable, reminder, setReminder, prefs, setPref } = useNotifications();
  const off = permission !== 'granted';
  const web = Platform.OS === 'web';

  return (
    <DetailScreen title="Notifications">
      {web ? (
        <Card>
          <Body style={{ color: c.ink2 }}>Notifications work in the iPhone and Android app.</Body>
        </Card>
      ) : off ? (
        <Card bg={c.lilac} style={{ gap: 10 }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: c.tangInk }}>Notifications are off</Text>
          <Body style={{ color: c.tangInk, fontSize: 14 }}>
            {permission === 'denied'
              ? 'Your phone is blocking them. Turn them on for Sprout Squad in Settings.'
              : 'Get a heads-up when your squad cheers you on, and a gentle evening reminder.'}
          </Body>
          <Button label={permission === 'denied' ? 'Open Settings' : 'Turn on'} onPress={() => (permission === 'denied' ? Linking.openSettings() : enable())} />
        </Card>
      ) : null}

      <Card style={{ gap: 0, paddingVertical: 6 }}>
        <Toggle label="Kudos and notes" detail="When a squadmate cheers you on." value={prefs.notify_kudos} onChange={(v) => setPref('notify_kudos', v).catch(() => {})} disabled={off} />
        <Divider />
        <Toggle label="Grow-together invites" detail="When someone starts a session you can join." value={prefs.notify_sessions} onChange={(v) => setPref('notify_sessions', v).catch(() => {})} disabled={off} />
        <Divider />
        <Toggle
          label="Quiet squadmates"
          detail="At 6pm, if a friend hasn’t logged for a few days. Once per quiet stretch."
          value={prefs.notify_nudges}
          onChange={(v) => setPref('notify_nudges', v).catch(() => {})}
          disabled={off}
        />
      </Card>

      <Card style={{ gap: 10 }}>
        <Toggle
          label="Evening reminder"
          detail="Only if you haven’t logged anything yet that day. Reply right from the notification."
          value={reminder.enabled}
          onChange={(v) => setReminder({ ...reminder, enabled: v })}
          disabled={off}
        />
        {reminder.enabled && !off && (
          <View style={{ gap: 8 }}>
            <Eyebrow>Time</Eyebrow>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {REMINDER_HOURS.map((h) => (
                <Chip key={h} label={hourLabel(h)} selected={reminder.hour === h} onPress={() => setReminder({ ...reminder, hour: h })} />
              ))}
            </View>
          </View>
        )}
      </Card>
    </DetailScreen>
  );
}

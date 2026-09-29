import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { eveningSlots, ReminderSettings } from './reminders';
import { supabase } from './supabase';

/**
 * Everything that touches expo-notifications lives here. Web has no push, so every
 * function is a no-op there. Push needs a real device and a dev/TestFlight build
 * (not Expo Go), plus the EAS project id in app.json (`eas init` adds it).
 */
const native = Platform.OS === 'ios' || Platform.OS === 'android';
const TOKEN_KEY = 'sprout:push-token';
const REMINDER_PREFIX = 'evening-';
export const LOG_CATEGORY = 'log-win';
export const LOG_ACTION = 'log';

export type Permission = 'granted' | 'denied' | 'undetermined';

let configured = false;

/** Call once at start-up: how pushes look in the foreground, the "Log a win" reply action, Android channel. */
export async function setupNotifications() {
  if (!native || configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  await Notifications.setNotificationCategoryAsync(LOG_CATEGORY, [
    {
      identifier: LOG_ACTION,
      buttonTitle: 'Log a win',
      textInput: { submitButtonTitle: 'Log', placeholder: 'What did you get done?' },
      // opening the app is what lets the reply get saved reliably, even if it was closed
      options: { opensAppToForeground: true },
    },
  ]);
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'Sprout Squad', importance: Notifications.AndroidImportance.DEFAULT });
  }
}

export async function getPermission(): Promise<Permission> {
  if (!native) return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  return status as Permission;
}

/** Shows the system prompt if it hasn't been answered yet. */
export async function askPermission(): Promise<Permission> {
  if (!native) return 'denied';
  const { status } = await Notifications.requestPermissionsAsync();
  return status as Permission;
}

/** Register this device for push under the signed-in user. Quietly does nothing if it can't. */
export async function registerPush(): Promise<void> {
  if (!native || !Device.isDevice || (await getPermission()) !== 'granted') return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return; // run `eas init` to add it
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
    if (!error) await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // offline or no network to Expo: we'll try again next launch
  }
}

/** Stop pushes to this device for the current user (call before signing out). */
export async function unregisterPush(): Promise<void> {
  if (!native) return;
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) await supabase.rpc('unregister_push_token', { p_token: token });
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {}
}

/** Replace the scheduled evening reminders for the next week. */
export async function planEveningReminders(settings: ReminderSettings, loggedToday: boolean): Promise<void> {
  if (!native) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled.filter((n) => n.identifier.startsWith(REMINDER_PREFIX)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    if (!settings.enabled || (await getPermission()) !== 'granted') return;
    for (const date of eveningSlots(new Date(), loggedToday, settings.hour)) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_PREFIX}${date.getTime()}`,
        content: {
          title: 'What did you get done today?',
          body: 'Log one small win. Even the laundry counts.',
          categoryIdentifier: LOG_CATEGORY,
          data: { url: '/' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      });
    }
  } catch {}
}

/** Ask a squad-related push to go out (fire and forget; the server double-checks everything). */
export function notifyServer(body: { type: 'kudo' | 'note'; to: string } | { type: 'session'; session_id: string }) {
  supabase.functions.invoke('notify', { body }).catch(() => {});
}

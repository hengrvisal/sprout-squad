import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { readCache, writeCache } from '@/lib/cache';
import {
  askPermission,
  getPermission,
  LOG_ACTION,
  Permission,
  planEveningReminders,
  registerPush,
  setupNotifications,
} from '@/lib/notifications';
import { DEFAULT_REMINDER, ReminderSettings } from '@/lib/reminders';
import { useAuth } from './auth';
import { useEntries } from './entries';
import { ProfilePatch, useProfile } from './profile';

type PushPref = 'notify_kudos' | 'notify_nudges' | 'notify_sessions';

type NotificationsState = {
  permission: Permission;
  /** Ask for permission (system prompt), then register this device. */
  enable: () => Promise<Permission>;
  reminder: ReminderSettings;
  setReminder: (r: ReminderSettings) => void;
  prefs: Record<PushPref, boolean>;
  setPref: (key: PushPref, on: boolean) => Promise<void>;
  /** The one-time "want a heads-up?" card on Today. */
  showPrompt: boolean;
  dismissPrompt: () => void;
};

const Ctx = createContext<NotificationsState | null>(null);
const native = Platform.OS === 'ios' || Platform.OS === 'android';

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { profile, save } = useProfile();
  const { today } = useEntries();
  const [permission, setPermission] = useState<Permission>('undetermined');
  const [reminder, setReminderState] = useState<ReminderSettings>(DEFAULT_REMINDER);
  const [promptDismissed, setPromptDismissed] = useState(true);
  const loggedToday = today.length > 0;

  useEffect(() => {
    setupNotifications();
  }, []);

  // per-user local settings, and register the device if push is already allowed
  useEffect(() => {
    if (!userId) return;
    readCache<ReminderSettings>(userId, 'reminder').then((r) => r && setReminderState(r));
    readCache<boolean>(userId, 'push-prompt-dismissed').then((d) => setPromptDismissed(!!d));
    getPermission().then((p) => {
      setPermission(p);
      if (p === 'granted') registerPush();
    });
  }, [userId]);

  // keep the server's idea of our time zone current (for 6pm nudges)
  useEffect(() => {
    if (!profile) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && profile.tz !== tz) save({ tz }).catch(() => {});
  }, [profile, save]);

  // re-plan tonight's reminder whenever it could have changed
  useEffect(() => {
    if (!userId) return;
    planEveningReminders(reminder, loggedToday);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        planEveningReminders(reminder, loggedToday);
        getPermission().then(setPermission); // they may have changed it in Settings
      }
    });
    return () => sub.remove();
  }, [userId, reminder, loggedToday, permission]);

  const enable = useCallback(async () => {
    const p = await askPermission();
    setPermission(p);
    if (p === 'granted') await registerPush();
    return p;
  }, []);

  const setReminder = useCallback(
    (r: ReminderSettings) => {
      setReminderState(r);
      if (userId) writeCache(userId, 'reminder', r);
    },
    [userId],
  );

  const prefs = useMemo(
    () => ({
      notify_kudos: profile?.notify_kudos ?? true,
      notify_nudges: profile?.notify_nudges ?? true,
      notify_sessions: profile?.notify_sessions ?? true,
    }),
    [profile],
  );

  const setPref = useCallback((key: PushPref, on: boolean) => save({ [key]: on } as ProfilePatch), [save]);

  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true);
    if (userId) writeCache(userId, 'push-prompt-dismissed', true);
  }, [userId]);

  const showPrompt = native && permission === 'undetermined' && !promptDismissed && loggedToday;

  const value = useMemo(
    () => ({ permission, enable, reminder, setReminder, prefs, setPref, showPrompt, dismissPrompt }),
    [permission, enable, reminder, setReminder, prefs, setPref, showPrompt, dismissPrompt],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNotifications must be used inside NotificationsProvider');
  return v;
}

/**
 * Acts on notification taps and on the "Log a win" typed reply. Mounted inside the tabs,
 * so navigation is ready (this also covers the app being launched by the tap).
 */
export function useNotificationResponses() {
  const { add, today } = useEntries();
  const handled = useRef(new Set<string>());
  const latest = useRef({ add, category: today[0]?.category ?? 'study' });
  useEffect(() => {
    latest.current = { add, category: today[0]?.category ?? 'study' };
  }, [add, today]);

  useEffect(() => {
    if (!native) return;
    const handle = (r: Notifications.NotificationResponse | null) => {
      if (!r) return;
      const key = `${r.notification.request.identifier}:${r.actionIdentifier}:${r.notification.date}`;
      if (handled.current.has(key)) return;
      handled.current.add(key);
      Notifications.clearLastNotificationResponse();

      const text = r.userText?.trim();
      if (r.actionIdentifier === LOG_ACTION && text) {
        latest.current.add(text.slice(0, 90), latest.current.category).catch(() => {});
        router.navigate('/');
        return;
      }
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/')) router.navigate(url as never);
    };
    handle(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, []);
}

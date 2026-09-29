import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tiny per-user JSON cache on the device. Used to show the last-known profile and
 * entries instantly on launch (and offline); Supabase stays the source of truth.
 */
const k = (userId: string, name: string) => `sprout:v1:${userId}:${name}`;

export async function readCache<T>(userId: string, name: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(k(userId, name));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache(userId: string, name: string, value: unknown): void {
  AsyncStorage.setItem(k(userId, name), JSON.stringify(value)).catch(() => {});
}

/** Remove everything cached for a user (on sign-out). */
export async function clearCache(userId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(`sprout:v1:${userId}:`)));
  } catch {}
}

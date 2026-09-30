import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CelebrateProvider } from '@/components/Celebrate';
import { AuthProvider, useAuth } from '@/hooks/auth';
import { FocusProvider } from '@/hooks/focus';
import { EntriesProvider } from '@/hooks/entries';
import { NotificationsProvider } from '@/hooks/notifications';
import { SessionsProvider } from '@/hooks/sessions';
import { ProfileProvider, useProfile } from '@/hooks/profile';
import { SquadsProvider } from '@/hooks/squads';
import { useColors } from '@/theme/tokens';

function RootStack() {
  const { session, loading } = useAuth();
  const { profile, ready } = useProfile();
  const c = useColors();
  const signedIn = !!session;
  // Wait until we know whether this user has seen the intro, so it never flashes.
  if (loading || (signedIn && !ready)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.ground }}>
        <ActivityIndicator color={c.ink} />
      </View>
    );
  }
  // A profile that couldn't load (offline, first launch) skips the intro rather than blocking the app.
  const needsIntro = signedIn && !!profile && !profile.onboarded_at;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.ground } }}>
      <Stack.Protected guard={signedIn && !needsIntro}>
        <Stack.Screen name="(tabs)" />
        {/* detail screens, one tap from the tabs */}
        <Stack.Screen name="day" />
        <Stack.Screen name="plan" />
        <Stack.Screen name="week" />
        <Stack.Screen name="search" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="session" />
        <Stack.Screen name="focus-settings" />
        <Stack.Screen name="plant" />
        <Stack.Screen name="friend/[id]" />
        <Stack.Screen name="squad-manage" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="account" />
      </Stack.Protected>
      <Stack.Protected guard={needsIntro}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    JetBrainsMono_700Bold,
  });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <EntriesProvider>
            <SquadsProvider>
              <SessionsProvider>
                <NotificationsProvider>
                  <CelebrateProvider>
                    <FocusProvider>
                      <StatusBar style="auto" />
                      <RootStack />
                    </FocusProvider>
                  </CelebrateProvider>
                </NotificationsProvider>
              </SessionsProvider>
            </SquadsProvider>
          </EntriesProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

import { router } from 'expo-router';
import { ProfileForm } from '@/components/me/ProfileForm';
import { DetailScreen } from '@/components/Screen';
import { Body } from '@/components/ui';
import { useProfile } from '@/hooks/profile';
import { useColors } from '@/theme/tokens';

export default function ProfileScreen() {
  const c = useColors();
  const { profile } = useProfile();
  return (
    <DetailScreen title="Profile">
      {profile ? (
        <ProfileForm key={`${profile.display_name}|${profile.emoji}`} profile={profile} onSaved={() => router.back()} />
      ) : (
        <Body style={{ color: c.ink3 }}>Loading…</Body>
      )}
    </DetailScreen>
  );
}

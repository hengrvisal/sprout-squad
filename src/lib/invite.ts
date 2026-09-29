import { Share } from 'react-native';

export function shareInvite(squad: { name: string; invite_code: string }) {
  return Share.share({
    message: `Join my squad "${squad.name}" on Sprout Squad. Code: ${squad.invite_code}\nhttps://sproutsquad.app`,
  }).catch(() => {});
}

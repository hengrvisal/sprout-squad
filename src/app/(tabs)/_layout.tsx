import { Slot } from 'expo-router';

/** The main pages live in one pager (see components/Pager.tsx), so this group is just a slot. */
export default function MainLayout() {
  return <Slot />;
}

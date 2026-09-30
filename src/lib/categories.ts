export const CATEGORIES = [
  { key: 'study', emoji: '📚', label: 'Study', color: '#9CC3D5' },
  { key: 'work', emoji: '💼', label: 'Work', color: '#E6C28A' },
  { key: 'build', emoji: '🛠️', label: 'Build', color: '#B7ACD3' },
  { key: 'move', emoji: '🏃', label: 'Move', color: '#E3A38C' },
  { key: 'home', emoji: '🏡', label: 'Home', color: '#9FCFB5' },
  { key: 'create', emoji: '🎨', label: 'Create', color: '#EBD68A' },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

export const categoryEmoji = (k: string) => CATEGORIES.find((c) => c.key === k)?.emoji ?? '✨';

export const categoryColor = (k: string) => CATEGORIES.find((c) => c.key === k)?.color ?? CATEGORIES[0].color;

export const AVATARS = ['🦊', '🐸', '🐼', '🐙', '🦉', '🐝', '🌵', '🍄', '🌻', '🐢', '🦄', '🍋'] as const;

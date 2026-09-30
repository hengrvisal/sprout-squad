export const CATEGORIES = [
  { key: 'study', emoji: '📚', label: 'Study', color: '#7CC4FF' },
  { key: 'work', emoji: '💼', label: 'Work', color: '#FFB443' },
  { key: 'build', emoji: '🛠️', label: 'Build', color: '#B9A6FF' },
  { key: 'move', emoji: '🏃', label: 'Move', color: '#FF6F91' },
  { key: 'home', emoji: '🏡', label: 'Home', color: '#6FE0C8' },
  { key: 'create', emoji: '🎨', label: 'Create', color: '#FFE45C' },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

export const categoryEmoji = (k: string) => CATEGORIES.find((c) => c.key === k)?.emoji ?? '✨';

export const categoryColor = (k: string) => CATEGORIES.find((c) => c.key === k)?.color ?? CATEGORIES[0].color;

export const AVATARS = ['🦊', '🐸', '🐼', '🐙', '🦉', '🐝', '🌵', '🍄', '🌻', '🐢', '🦄', '🍋'] as const;

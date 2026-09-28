export const CATEGORIES = [
  { key: 'study', label: 'Study', color: '#7CC4FF' },
  { key: 'work', label: 'Work', color: '#FFB443' },
  { key: 'build', label: 'Build', color: '#B9A6FF' },
  { key: 'move', label: 'Move', color: '#FF6F91' },
  { key: 'home', label: 'Home', color: '#6FE0C8' },
  { key: 'create', label: 'Create', color: '#FFE45C' },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

export const categoryColor = (k: string) => CATEGORIES.find((c) => c.key === k)?.color ?? CATEGORIES[0].color;

export const AVATARS = ['🦊', '🐸', '🐼', '🐙', '🦉', '🐝', '🌵', '🍄', '🌻', '🐢', '🦄', '🍋'] as const;

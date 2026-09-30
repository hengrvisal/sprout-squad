import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView } from 'react-native';

/** The five main pages, left to right. */
export const PAGES = ['today', 'month', 'focus', 'squad', 'me'] as const;
export type PageName = (typeof PAGES)[number];

type PagerState = {
  index: number;
  page: PageName;
  /** Scroll offset of the pager, for anything that should follow the finger (the tab bar). */
  scrollX: Animated.Value;
  /** Jump to a page (animated). Safe to call from anywhere, even before the pager is mounted. */
  goTo: (p: PageName | number, animated?: boolean) => void;
  /** Stop the pager from swiping while a gesture inside a page is in progress (e.g. the timer wheel). */
  setLocked: (locked: boolean) => void;
  locked: boolean;
  /** Used by the pager itself. */
  bind: { attach: (sv: ScrollView | null) => void; setWidth: (w: number) => void; setIndex: (i: number) => void };
};

const Ctx = createContext<PagerState | null>(null);

/** Maps a deep link / notification URL to a page, if it's one of the five. */
export function pageForUrl(url: string): PageName | null {
  const p = url.replace(/^\//, '').split(/[?#]/)[0];
  if (p === '' || p === 'today') return 'today';
  return (PAGES as readonly string[]).includes(p) ? (p as PageName) : null;
}

export function PagerProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [scrollX] = useState(() => new Animated.Value(0));
  const ref = useRef<ScrollView | null>(null);
  const width = useRef(0);

  const goTo = useCallback((p: PageName | number, animated = true) => {
    const i = typeof p === 'number' ? p : PAGES.indexOf(p);
    if (i < 0) return;
    setIndex(i);
    if (ref.current && width.current) ref.current.scrollTo({ x: i * width.current, animated });
  }, []);

  const setWidth = useCallback((w: number) => {
    width.current = w;
  }, []);
  const attach = useCallback((sv: ScrollView | null) => {
    ref.current = sv;
  }, []);

  const value = useMemo<PagerState>(
    () => ({ index, page: PAGES[index], scrollX, goTo, setLocked, locked, bind: { attach, setWidth, setIndex } }),
    [index, scrollX, goTo, locked, attach, setWidth],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePager() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePager must be used inside PagerProvider');
  return v;
}

/** True while this page is the one on screen. */
export function usePageActive(name: PageName) {
  return usePager().page === name;
}

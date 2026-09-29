import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { DetailScreen } from '@/components/Screen';
import { Body, Card, Dot, Eyebrow, Field, Mono } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { categoryColor } from '@/lib/categories';
import { containsPattern, dayLabel, RecapEntry } from '@/lib/recap';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/theme/tokens';

const LIMIT = 100;

/** Search every win you've ever logged. Handy for reviews, applications and "when did I…?" */
export default function Search() {
  const c = useColors();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [q, setQ] = useState('');
  const [results, setResults] = useState<RecapEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (!userId || term.length < 2) return;
    let live = true;
    // wait until typing pauses
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('id,text,category,done_on')
        .eq('user_id', userId)
        .ilike('text', containsPattern(term))
        .order('done_on', { ascending: false })
        .limit(LIMIT);
      if (!live) return;
      if (error) setError('Search didn’t work. Check your connection and try again.');
      else {
        setResults((data ?? []) as RecapEntry[]);
        setError(null);
      }
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, userId]);

  const active = q.trim().length >= 2;
  const shown = active ? results : null;

  return (
    <DetailScreen title="Search your wins">
      <View style={{ flexDirection: 'row' }}>
        <Field value={q} onChangeText={setQ} placeholder="e.g. assignment, run, shipped" autoFocus returnKeyType="search" accessibilityLabel="Search your wins" />
      </View>
      {error && <Body style={{ color: c.tang, fontSize: 13 }}>{error}</Body>}
      {!active && <Body style={{ color: c.ink3 }}>Type at least two letters. Everything you’ve ever logged is in here.</Body>}
      {shown && (
        <>
          <Eyebrow>
            {shown.length === LIMIT ? `Latest ${LIMIT} matches` : `${shown.length} ${shown.length === 1 ? 'match' : 'matches'}`}
          </Eyebrow>
          {shown.length === 0 ? (
            <Body style={{ color: c.ink3 }}>Nothing matches “{q.trim()}”. Try a shorter word.</Body>
          ) : (
            <Card style={{ gap: 10 }}>
              {shown.map((e) => (
                <View key={e.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ paddingTop: 5 }}>
                    <Dot color={categoryColor(e.category)} />
                  </View>
                  <Body style={{ flex: 1 }}>{e.text}</Body>
                  <Mono style={{ fontSize: 11.5, color: c.ink3, paddingTop: 3 }}>{dayLabel(e.done_on)}</Mono>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
    </DetailScreen>
  );
}

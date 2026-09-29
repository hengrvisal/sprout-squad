import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DetailScreen } from '@/components/Screen';
import { Body, Button, Card, Eyebrow, Field } from '@/components/ui';
import { useEntries } from '@/hooks/entries';
import { MAX_PLANS, PLAN_MAX_LEN } from '@/lib/plans';
import { fonts, radius, useColors } from '@/theme/tokens';

/** Today's plan: up to 3 things you mean to do. A plan, not a target. */
export default function PlanScreen() {
  const c = useColors();
  const { plans, addPlan, removePlan } = useEntries();
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const full = plans.length >= MAX_PLANS;

  async function onAdd() {
    const t = text;
    if (!t.trim() || full) return;
    setText('');
    setErr(null);
    try {
      await addPlan(t);
    } catch {
      setText(t);
      setErr('Couldn’t save that. Check your connection and try again.');
    }
  }

  return (
    <DetailScreen title="Today’s plan">
      <Card bg={c.sky} style={{ gap: 6 }}>
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: c.tangInk }}>A plan, not a target</Text>
        <Body style={{ color: c.tangInk, fontSize: 14 }}>
          Your squad can see it. Tick things off from Today and they’re logged as wins. Anything you don’t get to just disappears at midnight.
        </Body>
      </Card>

      <Card style={{ gap: 10 }}>
        <Eyebrow>
          {plans.length} of {MAX_PLANS}
        </Eyebrow>
        {plans.length === 0 && <Body style={{ color: c.ink3 }}>Nothing planned yet. What’s one thing you’d like to get done today?</Body>}
        {plans.map((p) => (
          <View
            key={p.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.screen, borderWidth: 2, borderColor: c.soft, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12 }}
          >
            <Text style={{ fontSize: 15 }}>{p.entry_id ? '✅' : '⬜️'}</Text>
            <Body style={{ flex: 1, fontFamily: fonts.bodyMedium, color: p.entry_id ? c.ink3 : c.ink }}>{p.text}</Body>
            {p.entry_id ? (
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: c.ink3 }}>logged</Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${p.text}`}
                hitSlop={8}
                disabled={p.id.startsWith('temp-')}
                onPress={() => removePlan(p.id).catch(() => setErr('Couldn’t remove that. Try again.'))}
              >
                <Text style={{ fontSize: 18, color: c.ink3, paddingHorizontal: 4 }}>×</Text>
              </Pressable>
            )}
          </View>
        ))}
        {!full && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Field
              value={text}
              onChangeText={setText}
              maxLength={PLAN_MAX_LEN}
              placeholder="e.g. Finish the lab report"
              returnKeyType="done"
              onSubmitEditing={onAdd}
              accessibilityLabel="Something you plan to do today"
            />
            <Button label="Add" onPress={onAdd} disabled={!text.trim()} />
          </View>
        )}
        {full && <Body style={{ color: c.ink3, fontSize: 13.5 }}>Three’s plenty. Anything else is a bonus.</Body>}
        {err && <Body style={{ color: c.tang, fontSize: 13 }}>{err}</Body>}
      </Card>
    </DetailScreen>
  );
}

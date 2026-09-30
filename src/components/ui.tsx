import { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, Text, TextInput, TextInputProps, TextProps, View, ViewStyle } from 'react-native';
import { fonts, radius, softShadow, useColors } from '@/theme/tokens';

/**
 * A soft surface: frosted card, rounded, gentle diffuse shadow, hairline edge.
 * (Name kept from the old chunky look so every screen picks up the new style.)
 */
export function Chunky({
  children,
  style,
  bg,
  r = radius.lg,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: string;
  r?: number;
  offset?: number;
}) {
  const c = useColors();
  return (
    <View style={[{ backgroundColor: bg ?? c.glass, borderRadius: r, borderWidth: 1, borderColor: c.line }, softShadow(c), style]}>
      {children}
    </View>
  );
}

export function Card({ children, style, bg }: { children: ReactNode; style?: StyleProp<ViewStyle>; bg?: string }) {
  return (
    <Chunky bg={bg} style={[{ padding: 18, gap: 12 }, style]}>
      {children}
    </Chunky>
  );
}

export function H({ children, size = 19, style, ...rest }: TextProps & { size?: number }) {
  const c = useColors();
  return (
    <Text {...rest} style={[{ fontFamily: fonts.displayBold, fontSize: size, color: c.ink, letterSpacing: -0.2 }, style]}>
      {children}
    </Text>
  );
}

export function Eyebrow({ children, style, ...rest }: TextProps) {
  const c = useColors();
  return (
    <Text
      {...rest}
      style={[{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: c.ink3 }, style]}
    >
      {children}
    </Text>
  );
}

export function Body({ children, style, ...rest }: TextProps) {
  const c = useColors();
  return (
    <Text {...rest} style={[{ fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: c.ink }, style]}>
      {children}
    </Text>
  );
}

export function Mono({ children, style, ...rest }: TextProps) {
  const c = useColors();
  return (
    <Text {...rest} style={[{ fontFamily: fonts.mono, color: c.ink, fontVariant: ['tabular-nums'] }, style]}>
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
  style,
  ...rest
}: Omit<PressableProps, 'style'> & { label: string; variant?: 'primary' | 'ghost'; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const primary = variant === 'primary';
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: primary ? c.accent : c.glass,
          borderRadius: radius.pill,
          paddingVertical: 12,
          paddingHorizontal: 20,
          alignItems: 'center',
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
          borderWidth: primary ? 0 : 1,
          borderColor: c.line,
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15.5, color: primary ? '#FFFFFF' : c.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  dot,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  dot?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: radius.pill,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: selected ? c.ink : c.glass,
      }}
    >
      {dot && <Dot color={dot} />}
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: selected ? c.screen : c.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Dot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
  );
}

/** Standard text input with the chunky outline. */
export function Field({ style, ...rest }: TextInputProps) {
  const c = useColors();
  return (
    <TextInput
      placeholderTextColor={c.ink3}
      {...rest}
      style={[
        {
          flex: 1,
          minWidth: 0,
          backgroundColor: c.glassStrong,
          borderWidth: 1,
          borderColor: c.line,
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingHorizontal: 14,
          fontFamily: fonts.body,
          fontSize: 15,
          color: c.ink,
        },
        style,
      ]}
    />
  );
}

/** A card you can tap to open more detail. Shows a › in the corner and presses in like a button. */
export function TapCard({
  children,
  onPress,
  bg,
  style,
  label,
}: {
  children: ReactNode;
  onPress: () => void;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  /** Screen-reader label for what opening it does, e.g. "Open today's list". */
  label: string;
}) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {({ pressed }) => (
        // dims on press instead of moving, so the layout stays put
        <View style={{ opacity: pressed ? 0.55 : 1 }}>
          <Chunky bg={bg} style={[{ padding: 18, gap: 12 }, style]}>
            {children}
          </Chunky>
          <Text style={{ position: 'absolute', top: 14, right: 18, fontFamily: fonts.bodySemi, fontSize: 20, color: c.ink3 }}>›</Text>
        </View>
      )}
    </Pressable>
  );
}

/** A plain list row (settings style): label, optional value, chevron. */
export function Row({ label, value, onPress, danger }: { label: string; value?: string; onPress: () => void; danger?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 4,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 16, color: danger ? c.tang : c.ink }}>{label}</Text>
      {value ? <Text style={{ fontFamily: fonts.body, fontSize: 15, color: c.ink3 }}>{value}</Text> : null}
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 18, color: c.ink3 }}>›</Text>
    </Pressable>
  );
}

export function Divider() {
  const c = useColors();
  return <View style={{ height: 1, backgroundColor: c.line }} />;
}

export function ProgressBar({ value, color, height = 10 }: { value: number; color: string; height?: number }) {
  const c = useColors();
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: c.soft, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, height: '100%', borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

import { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextProps, View, ViewStyle } from 'react-native';
import { border, fonts, radius, shadowOffset, useColors } from '@/theme/tokens';

/**
 * A chunky, hard-shadowed block. The shadow is a second View offset behind the
 * face, so it looks identical on iOS, Android and web.
 */
export function Chunky({
  children,
  style,
  bg,
  r = radius.lg,
  offset = shadowOffset,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: string;
  r?: number;
  offset?: number;
}) {
  const c = useColors();
  return (
    <View style={{ paddingRight: offset, paddingBottom: offset }}>
      <View style={[StyleSheet.absoluteFill, { top: offset, left: offset, backgroundColor: c.line, borderRadius: r }]} />
      <View style={[{ backgroundColor: bg ?? c.card, borderColor: c.line, borderWidth: border, borderRadius: r }, style]}>
        {children}
      </View>
    </View>
  );
}

export function Card({ children, style, bg }: { children: ReactNode; style?: StyleProp<ViewStyle>; bg?: string }) {
  return (
    <Chunky bg={bg} style={[{ padding: 16, gap: 12 }, style]}>
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
  const bg = variant === 'primary' ? c.grid[3] : c.card;
  const fg = variant === 'primary' ? c.onGreen : c.ink;
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}
    >
      {({ pressed }) => (
        <View style={{ paddingRight: shadowOffset, paddingBottom: shadowOffset }}>
          {!pressed && (
            <View
              style={[StyleSheet.absoluteFill, { top: shadowOffset, left: shadowOffset, backgroundColor: c.line, borderRadius: radius.md }]}
            />
          )}
          <View
            style={{
              backgroundColor: bg,
              borderColor: c.line,
              borderWidth: border,
              borderRadius: radius.md,
              paddingVertical: 10,
              paddingHorizontal: 16,
              alignItems: 'center',
              transform: pressed ? [{ translateX: shadowOffset }, { translateY: shadowOffset }] : [],
            }}
          >
            <Text style={{ fontFamily: fonts.display, fontSize: 16, color: fg }}>{label}</Text>
          </View>
        </View>
      )}
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
        borderWidth: 2,
        borderColor: c.line,
        borderRadius: radius.pill,
        paddingVertical: 4,
        paddingHorizontal: 10,
        backgroundColor: selected ? c.ink : c.card,
      }}
    >
      {dot && <Dot color={dot} />}
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: selected ? c.screen : c.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Dot({ color, size = 10 }: { color: string; size?: number }) {
  const c = useColors();
  return (
    <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color, borderWidth: 1, borderColor: c.line }} />
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
          backgroundColor: c.screen,
          borderWidth: border,
          borderColor: c.line,
          borderRadius: radius.md,
          paddingVertical: 11,
          paddingHorizontal: 12,
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
        <View style={{ transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [] }}>
          <Chunky bg={bg} style={[{ padding: 16, gap: 12 }, style]} offset={pressed ? 1 : shadowOffset}>
            {children}
          </Chunky>
          <Text style={{ position: 'absolute', top: 10, right: 16, fontFamily: fonts.mono, fontSize: 20, color: c.ink3 }}>›</Text>
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
      <Text style={{ fontFamily: fonts.mono, fontSize: 18, color: c.ink3 }}>›</Text>
    </Pressable>
  );
}

export function Divider() {
  const c = useColors();
  return <View style={{ height: 1.5, backgroundColor: c.soft }} />;
}

export function ProgressBar({ value, color, height = 10 }: { value: number; color: string; height?: number }) {
  const c = useColors();
  return (
    <View style={{ height, borderRadius: height / 2, borderWidth: 2, borderColor: c.line, backgroundColor: c.soft, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

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

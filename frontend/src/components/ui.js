import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text as NativeText, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fonts } from '../theme';
import { Text, TextInput } from './Typography';

export function Icon({ name, size = 20, color = colors.primary }) {
  return <Ionicons name={name} size={size} color={color} accessible={false} />;
}
export function IconButton({ label, icon, onPress, disabled, color = colors.text, style, expanded }) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled, ...(expanded === undefined ? {} : { expanded }) }}
    disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.iconButton, style, focused && styles.focused, pressed && styles.pressed, disabled && styles.disabled]}>
    <Icon name={icon} color={color} />
  </Pressable>;
}
export function Button({ title, onPress, icon, variant = 'primary', loading, disabled, style, accessibilityLabel }) {
  const [focused, setFocused] = useState(false);
  const blocked = disabled || loading;
  const ink = variant === 'primary' ? colors.surface : variant === 'danger' ? colors.danger : colors.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} accessibilityState={{ disabled: !!blocked, busy: !!loading }}
    disabled={blocked} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.button, styles[variant], style, focused && styles.focused, blocked && styles.disabled, pressed && styles.pressed]}>
    {loading ? <ActivityIndicator color={ink} size="small" /> : icon ? <Icon name={icon} color={ink} size={18} /> : null}
    <Text style={[styles.buttonText, { color: ink }]}>{title}</Text>
  </Pressable>;
}
export function Field({ label, error, style, inputRef, ...props }) {
  const [focused, setFocused] = useState(false);
  return <View style={[styles.field, style]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput ref={inputRef} accessibilityLabel={label} placeholderTextColor={colors.muted} {...props}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={[styles.input, focused && styles.focused, error && styles.invalid, props.style]} />
    {!!error && <Text accessibilityLiveRegion="polite" style={styles.fieldError}>{error}</Text>}
  </View>;
}
export function Feedback({ message, retry, success = false }) {
  if (!message) return null;
  return <View accessibilityLiveRegion="polite" style={[styles.feedback, success && styles.feedbackSuccess]}>
    <View style={styles.feedbackRow}><Icon name={success ? 'checkmark-circle-outline' : 'alert-circle-outline'} color={success ? colors.successText : colors.danger} size={18} /><Text style={[styles.feedbackText, success && { color: colors.successText }]}>{message}</Text></View>
    {retry && <Button title="Retry" onPress={retry} variant="secondary" style={styles.retry} />}
  </View>;
}
export function Brand({ light = false, large = false }) {
  return <View style={styles.brand}>
    {large && <Icon name="people-outline" size={50} color={light ? colors.mint : colors.primary} />}
    <View><NativeText testID="tnpkhr-logo" accessibilityRole={large ? 'header' : undefined} style={[styles.brandText, light && { color: colors.surface }, large && styles.brandLarge]}>TNPK<NativeText style={{ color: light ? colors.mint : colors.teal }}>HR</NativeText></NativeText>
      {large && <Text style={styles.brandCaption}>HR Manager & Salary Analytics</Text>}
    </View>
  </View>;
}
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, gap: 16 },
  heading: { fontFamily: fonts.body, fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.6 },
  title: { fontFamily: fonts.body, fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.4 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24, color: colors.muted },
  eyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
const styles = StyleSheet.create({
  button: { minHeight: 46, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 16, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  primary: { backgroundColor: colors.primary }, secondary: { backgroundColor: colors.mist }, danger: { backgroundColor: colors.dangerTint },
  buttonText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'center' },
  iconButton: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  focused: { borderColor: colors.teal, outlineColor: colors.teal, outlineWidth: 2, outlineOffset: 2 },
  pressed: { opacity: 0.7 }, disabled: { opacity: 0.5 },
  field: { gap: 7 }, label: { fontFamily: fonts.body, color: colors.text, fontSize: 13, fontWeight: '600' },
  input: { fontFamily: fonts.body, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 11, minHeight: 48, paddingHorizontal: 13, paddingVertical: 12, color: colors.text, fontSize: 14 },
  invalid: { borderColor: colors.danger }, fieldError: { fontSize: 12, color: colors.danger, lineHeight: 18 },
  feedback: { padding: 12, borderRadius: 12, backgroundColor: colors.dangerTint, gap: 8 }, feedbackSuccess: { backgroundColor: colors.successTint },
  feedbackRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, feedbackText: { flex: 1, color: colors.danger, fontSize: 12, lineHeight: 19 }, retry: { alignSelf: 'flex-start' },
  brand: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  brandText: { fontFamily: fonts.logo, color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -1 },
  brandLarge: { fontSize: 43, letterSpacing: -2 }, brandCaption: { fontFamily: fonts.body, fontSize: 12, color: colors.onPrimary, marginTop: 3 },
});

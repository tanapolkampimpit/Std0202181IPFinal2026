import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fonts } from '../theme';

export function Icon({ name, size = 20, color = colors.primary }) {
  return <Ionicons name={name} size={size} color={color} accessible={false} />;
}
export function Button({ title, onPress, icon, variant = 'primary', loading, disabled, style, accessibilityLabel }) {
  const blocked = disabled || loading;
  const ink = variant === 'primary' ? colors.surface : variant === 'danger' ? colors.danger : colors.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} accessibilityState={{ disabled: !!blocked, busy: !!loading }}
    disabled={blocked} onPress={onPress} style={({ pressed }) => [styles.button, styles[variant], style, blocked && styles.disabled, pressed && styles.pressed]}>
    {loading ? <ActivityIndicator color={ink} size="small" /> : icon ? <Icon name={icon} color={ink} size={18} /> : null}
    <Text style={[styles.buttonText, { color: ink }]}>{title}</Text>
  </Pressable>;
}
export function Field({ label, error, style, inputRef, ...props }) {
  return <View style={[styles.field, style]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput ref={inputRef} accessibilityLabel={label} placeholderTextColor={colors.muted} {...props} style={[styles.input, error && styles.invalid, props.style]} />
    {!!error && <Text accessibilityLiveRegion="polite" style={styles.fieldError}>{error}</Text>}
  </View>;
}
export function Feedback({ message, retry, success = false }) {
  if (!message) return null;
  return <View accessibilityLiveRegion="polite" style={[styles.feedback, success && styles.feedbackSuccess]}>
    <View style={styles.feedbackRow}><Icon name={success ? 'checkmark-circle-outline' : 'alert-circle-outline'} color={success ? colors.successText : colors.danger} /><Text style={[styles.feedbackText, success && { color: colors.successText }]}>{message}</Text></View>
    {retry && <Button title="Retry" onPress={retry} variant="secondary" style={styles.retry} />}
  </View>;
}
export function Brand({ light = false }) {
  return <View style={styles.brand}><View style={[styles.brandIcon, light && styles.brandIconLight]}><Icon name="layers" color={light ? colors.primary : colors.surface} size={22} /></View><Text style={[styles.brandText, light && { color: colors.surface }]}>Blue<Text style={{ fontWeight: '400' }}>HR</Text></Text></View>;
}
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 20 },
  heading: { fontFamily: fonts.body, fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.6 },
  title: { fontFamily: fonts.body, fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.muted },
  eyebrow: { fontFamily: fonts.body, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
const styles = StyleSheet.create({
  button: { minHeight: 48, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  primary: { backgroundColor: colors.primary }, secondary: { backgroundColor: colors.lightBlue }, danger: { backgroundColor: colors.dangerTint },
  buttonText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  pressed: { opacity: 0.75 }, disabled: { opacity: 0.5 },
  field: { gap: 8 }, label: { fontFamily: fonts.body, color: colors.text, fontSize: 13, fontWeight: '600' },
  input: { fontFamily: fonts.body, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 15 },
  invalid: { borderColor: colors.danger }, fieldError: { fontSize: 12, color: colors.danger, lineHeight: 18 },
  feedback: { padding: 14, borderRadius: 12, backgroundColor: colors.dangerTint, gap: 8 }, feedbackSuccess: { backgroundColor: colors.successTint },
  feedbackRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, feedbackText: { flex: 1, color: colors.danger, fontSize: 13, lineHeight: 20 }, retry: { alignSelf: 'flex-start' },
  brand: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  brandIcon: { width: 36, height: 36, backgroundColor: colors.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, brandIconLight: { backgroundColor: colors.surface },
  brandText: { fontFamily: fonts.body, color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -1 },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Icon, ui } from './ui';
import { colors, fonts, formatTHB, shadow } from '../theme';

export default function EmployeeCard({ employee, busy, onToggle, onDelete }) {
  const active = employee.status === 'Active';
  const initials = employee.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join('').toUpperCase();
  return <View style={styles.card}>
    <View style={ui.row}>
      <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
      <View style={styles.identity}><Text style={styles.name}>{employee.name}</Text><Text style={styles.position}>{employee.position}</Text></View>
    </View>
    <View style={styles.details}>
      <View><Text style={styles.salaryLabel}>BASE SALARY / MONTH</Text><Text style={styles.salary}>{formatTHB(employee.salary)}</Text></View>
      <View style={[styles.badge, { backgroundColor: active ? colors.successTint : colors.warningTint }]}><Icon name={active ? 'checkmark-circle' : 'time-outline'} size={13} color={active ? colors.successText : colors.warningText} /><Text style={[styles.status, { color: active ? colors.successText : colors.warningText }]}>{employee.status}</Text></View>
    </View>
    <View style={styles.actions}>
      <Button title="Toggle Status" accessibilityLabel={`Toggle Status for ${employee.name}`} icon="swap-horizontal-outline" variant="secondary" disabled={busy} onPress={() => onToggle(employee)} style={styles.toggle} />
      <Button title="Delete" accessibilityLabel={`Delete ${employee.name}`} icon="trash-outline" variant="danger" disabled={busy} onPress={() => onDelete(employee)} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 16, ...shadow },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.lightBlue, alignItems: 'center', justifyContent: 'center' }, initials: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  identity: { flex: 1, gap: 4 }, name: { color: colors.text, fontFamily: fonts.body, fontSize: 16, fontWeight: '700' }, position: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  details: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  salaryLabel: { fontSize: 9, letterSpacing: 1, color: colors.muted, marginBottom: 4, fontWeight: '600' }, salary: { color: colors.text, fontSize: 19, fontWeight: '700', fontVariant: ['tabular-nums'] },
  badge: { flexDirection: 'row', gap: 4, alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 }, status: { fontWeight: '600', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border }, toggle: { flex: 1 },
});

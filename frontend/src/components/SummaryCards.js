import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './ui';
import { colors } from '../theme';

export default function SummaryCards({ employees, loaded }) {
  const active = employees.filter(({ status }) => status === 'Active').length;
  const items = [
    { title: 'Total Employees', value: employees.length, icon: 'people-outline', color: colors.primary, tint: colors.lightBlue },
    { title: 'Active Employees', value: active, icon: 'checkmark-circle-outline', color: colors.successText, tint: colors.successTint },
    { title: 'On Leave', value: employees.length - active, icon: 'time-outline', color: colors.warningText, tint: colors.warningTint },
  ];
  return <View style={styles.row}>{items.map((item) => <View key={item.title} style={styles.card}>
    <View style={[styles.icon, { backgroundColor: item.tint }]}><Icon name={item.icon} color={item.color} size={18} /></View>
    <Text style={styles.value}>{loaded ? item.value : '—'}</Text><Text style={styles.label}>{item.title}</Text>
  </View>)}</View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 }, card: { flex: 1, backgroundColor: colors.surface, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, gap: 8 },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, value: { fontSize: 27, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] }, label: { fontSize: 11, color: colors.muted, lineHeight: 16 },
});

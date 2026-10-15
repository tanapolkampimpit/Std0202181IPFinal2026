import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Typography';
import { Icon } from './ui';
import { colors, shadow } from '../theme';

export default function SummaryCards({ employees, loaded }) {
  const active = employees.filter(({ status }) => status === 'Active').length;
  const items = [
    { title: 'Total Staff', value: employees.length, icon: 'people-outline', color: colors.primary, tint: colors.avatar },
    { title: 'Active', value: active, icon: 'checkmark-outline', color: colors.successText, tint: colors.successTint },
    { title: 'On Leave', value: employees.filter(({ status }) => status === 'On Leave').length, icon: 'time-outline', color: colors.warningText, tint: colors.warningTint },
  ];
  return <View style={styles.row}>{items.map((item) => <View key={item.title} style={styles.card} accessibilityLabel={item.title + ': ' + (loaded ? item.value : 'Loading')}>
    <View style={styles.top}><View style={[styles.icon, { backgroundColor: item.tint }]}><Icon name={item.icon} color={item.color} size={19} /></View>
      <Text style={[styles.value, { color: item.color }]}>{loaded ? item.value : '—'}</Text></View>
    <Text style={styles.label}>{item.title}</Text>
  </View>)}</View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 }, card: { flex: 1, backgroundColor: '#F9FCFB', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, alignItems: 'center', gap: 6, ...shadow },
  top: { flexDirection: 'row', alignItems: 'center', gap: 7 }, icon: { width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 25, fontWeight: '800', fontVariant: ['tabular-nums'] }, label: { fontSize: 10, color: colors.muted },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import ChartPanel, { chartColor, ChartNote, compactSalary } from './ChartPanel';
import { Text } from './Typography';
import { colors, formatTHB } from '../theme';

// A legacy server without membership data must never produce invented ranges.
export const hasSalaryMembers = (clusters) => clusters.every((group) => Array.isArray(group.salaries) && group.salaries.length === group.count && group.salaries.every((salary) => Number.isFinite(salary) && salary > 0));
export default function SalaryRange({ clusters }) {
  const ready = hasSalaryMembers(clusters);
  const max = clusters.reduce((highest, group) => (group.salaries || []).reduce((value, salary) => Math.max(value, salary), highest), 10000);
  const position = (salary) => `${Math.max(0, Math.min(100, salary / max * 100))}%`;
  return <ChartPanel number={3} type="RANGE" title="Salary Range & Centroid" tag="Min → Max">
    {!ready ? <ChartNote>Update the backend to display salary ranges from cluster membership.</ChartNote> : <>
      {clusters.map((group, i) => {
        const minSalary = group.count ? group.salaries.reduce((min, salary) => Math.min(min, salary), Infinity) : null;
        const maxSalary = group.count ? group.salaries.reduce((max, salary) => Math.max(max, salary), 0) : null;
        const color = chartColor(i);
        return <View key={group.group} style={styles.row} accessible accessibilityLabel={`Tier ${i + 1}: ${group.count ? `minimum ${formatTHB(minSalary)}, average ${formatTHB(group.centroid)}, maximum ${formatTHB(maxSalary)}` : 'no employees'}`}>
          <View style={styles.head}><Text style={styles.label}>Tier {i + 1}</Text><Text style={styles.value}>{group.count ? `Avg ${formatTHB(group.centroid, true)}` : 'No employees'}</Text></View>
          <View style={styles.track}>{group.count > 0 && <>
            <View style={[styles.segment, { left: position(minSalary), width: position(maxSalary - minSalary), backgroundColor: color }]} />
            {[minSalary, maxSalary].map((salary, end) => <View key={end} style={[styles.end, { left: position(salary), backgroundColor: color }]} />)}
            <View style={[styles.mean, { left: position(group.centroid), borderColor: color }]}><View style={styles.dot} /></View>
          </>}</View>
          {group.count > 0 && <View style={styles.head}><Text style={styles.value}>Min {formatTHB(minSalary, true)}</Text><Text style={styles.value}>Max {formatTHB(maxSalary, true)}</Text></View>}
        </View>;
      })}
      <View style={styles.scale}><Text style={styles.value}>฿0</Text><Text style={styles.value}>Salary (THB)</Text><Text style={styles.value}>฿{compactSalary(max)}</Text></View>
    </>}
    <ChartNote>Dot = cluster average; colored line = lowest to highest salary.</ChartNote>
  </ChartPanel>;
}
const styles = StyleSheet.create({
  row: { gap: 10, paddingHorizontal: 7, paddingVertical: 4 }, head: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 5 },
  label: { fontSize: 12, fontWeight: '700', color: colors.text }, value: { fontSize: 12, color: colors.muted },
  track: { height: 12, borderRadius: 9, backgroundColor: '#EDF4F4', position: 'relative' },
  segment: { position: 'absolute', top: 4, height: 4, borderRadius: 4 }, end: { position: 'absolute', top: 2, width: 8, height: 8, borderRadius: 4, marginLeft: -4 },
  mean: { position: 'absolute', top: -3, width: 18, height: 18, marginLeft: -9, borderRadius: 9, borderWidth: 2, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text }, scale: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
});

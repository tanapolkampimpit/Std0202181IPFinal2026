import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, formatTHB, tierColors } from '../theme';
import { ui } from './ui';

const compact = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const chartHeight = 180;
const labelHeight = 21;
const topSpace = 24;
const plotHeight = chartHeight - labelHeight - topSpace;
export default function SalaryChart({ clusters }) {
  const highest = Math.max(0, ...clusters.map(({ centroid }) => centroid ?? 0));
  const magnitude = highest > 0 ? 10 ** Math.floor(Math.log10(highest)) : 1;
  const ceiling = highest > 0 ? Math.ceil(highest / magnitude) * magnitude : 1;
  return <View style={styles.panel}>
    <Text accessibilityRole="header" style={styles.title}>Visualization</Text>
    <View style={styles.chart} accessibilityLabel="Average monthly salary by group">
      <View style={styles.axis}>{[1, 0.75, 0.5, 0.25, 0].map((fraction) => <Text key={fraction} style={styles.tick}>{compact(ceiling * fraction)}</Text>)}</View>
      <View style={styles.plot}>
        <View style={styles.grid} accessible={false}>{[0, 1, 2, 3, 4].map((index) => <View key={index} style={styles.gridline} />)}</View>
        {clusters.map((cluster, index) => <View key={cluster.group} style={styles.column} accessible accessibilityLabel={`Group ${index + 1}: ${cluster.centroid === null ? 'no salary data' : formatTHB(cluster.centroid)} average monthly salary`}>
          <View style={styles.barSpace}>
            <Text style={styles.value}>{cluster.centroid === null ? '—' : `฿${compact(cluster.centroid)}`}</Text>
            <View style={[styles.bar, { height: cluster.centroid === null ? 0 : Math.max(2, cluster.centroid / ceiling * plotHeight), backgroundColor: tierColors[index].bar }]} />
          </View><Text style={styles.barLabel}>Group {index + 1}</Text>
        </View>)}
      </View>
    </View><Text style={styles.caption}>Salary group · average THB / month</Text>
  </View>;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: 15, padding: 14, gap: 16 }, title: { ...ui.title, fontSize: 15 },
  chart: { height: chartHeight, flexDirection: 'row', gap: 9 }, axis: { width: 32, paddingTop: topSpace - 4, paddingBottom: labelHeight - 4, justifyContent: 'space-between' }, tick: { color: colors.muted, fontSize: 9, textAlign: 'right' },
  plot: { flex: 1, minWidth: 0, flexDirection: 'row', gap: 8, alignItems: 'flex-end', paddingHorizontal: 4 }, grid: { position: 'absolute', left: 0, right: 0, top: topSpace, bottom: labelHeight, justifyContent: 'space-between' }, gridline: { height: 1, backgroundColor: '#E1ECEA' },
  column: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }, barSpace: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  bar: { width: '90%', maxWidth: 88, borderTopLeftRadius: 4, borderTopRightRadius: 4 }, value: { color: colors.text, fontSize: 9, fontWeight: '700' }, barLabel: { color: colors.muted, fontSize: 9, height: labelHeight, paddingTop: 7 }, caption: { fontSize: 10, color: colors.muted, textAlign: 'center' },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import ChartPanel, { chartColor, ChartNote } from './ChartPanel';
import { Text } from './Typography';
import { colors } from '../theme';

export default function SalaryDistribution({ clusters }) {
  const total = clusters.reduce((sum, group) => sum + group.count, 0);
  const circumference = 2 * Math.PI * 49;
  let consumed = 0;
  return <ChartPanel number={2} type="DONUT" title="Employee Distribution" tag="Cluster size">
    <View style={styles.row}>
      <View style={styles.donut} accessible accessibilityLabel={`Employee distribution: ${total} employees. ${clusters.map((group, i) => `Tier ${i + 1}: ${group.count}`).join(', ')}`}>
        <Svg width={124} height={124} viewBox="0 0 124 124" accessible={false}>
          <Circle cx={62} cy={62} r={49} stroke="#E3EEEE" strokeWidth={22} fill="none" />
          {clusters.map((group, i) => {
            const length = total ? group.count / total * circumference : 0;
            const offset = consumed; consumed += length;
            return length > 0 ? <Circle key={group.group} cx={62} cy={62} r={49} fill="none" stroke={chartColor(i)} strokeWidth={22} strokeDasharray={`${length} ${circumference}`} strokeDashoffset={-offset} rotation={-90} origin="62, 62" /> : null;
          })}
        </Svg>
        <View pointerEvents="none" style={styles.center}><Text style={styles.total}>{total}</Text><Text style={styles.small}>Employees</Text></View>
      </View>
      <View style={styles.legend}>{clusters.map((group, i) => <View key={group.group} style={styles.legendRow}>
        <View style={styles.label}><View style={[styles.key, { backgroundColor: chartColor(i) }]} /><Text style={styles.small}>Tier {i + 1}</Text></View>
        <Text style={styles.share}>{group.count} · {total ? Math.round(group.count / total * 100) : 0}%</Text>
      </View>)}</View>
    </View>
    <ChartNote>Proportion of employees assigned to each salary cluster.</ChartNote>
  </ChartPanel>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  donut: { width: 124, height: 124 }, center: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  total: { fontSize: 25, fontWeight: '800', color: colors.text }, small: { fontSize: 12, color: colors.muted },
  legend: { flex: 1, minWidth: 112, gap: 10 }, legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 6 }, key: { width: 9, height: 9, borderRadius: 3 }, share: { fontSize: 12, fontWeight: '700', color: colors.text },
});

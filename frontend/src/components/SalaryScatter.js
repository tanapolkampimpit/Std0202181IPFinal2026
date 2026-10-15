import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import ChartPanel, { chartColor, ChartNote, compactSalary } from './ChartPanel';
import { hasSalaryMembers } from './SalaryRange';
import { Text } from './Typography';
import { colors, fonts, formatTHB } from '../theme';

export default function SalaryScatter({ clusters }) {
  const [width, setWidth] = useState(320);
  const ready = hasSalaryMembers(clusters);
  const total = clusters.reduce((sum, group) => sum + group.count, 0);
  const highest = clusters.reduce((max, group) => (group.salaries || []).reduce((value, salary) => Math.max(value, salary), max), 0);
  const magnitude = highest ? 10 ** Math.floor(Math.log10(highest)) : 10000;
  const max = highest ? Math.ceil(highest * 1.1 / magnitude) * magnitude : 10000;
  const plotBottom = 30 + clusters.length * 48;
  const height = plotBottom + 56;
  const x = (salary) => 45 + salary / max * (width - 65);
  const y = (i) => plotBottom - 25 - i * 48;
  const label = { fill: colors.muted, fontSize: 12, fontFamily: fonts.body };
  return <ChartPanel number={4} type="SCATTER PLOT" title="K-Means Salary Clusters" tag={`K = ${clusters.length}`}>
    {!ready ? <ChartNote>Update the backend to display salary points from cluster membership.</ChartNote> : !total ? <ChartNote>No salary data to visualize.</ChartNote> :
      <View style={styles.visual} onLayout={(event) => setWidth(Math.max(240, event.nativeEvent.layout.width))} accessible accessibilityLabel={`Salary scatter plot: ${total} employees in ${clusters.length} salary tiers. Each dot represents an employee's salary; ringed dots show cluster averages.`}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} accessible={false}>
          {[0, 1, 2, 3, 4].map((tick) => <G key={tick}>
            <Line x1={x(max * tick / 4)} x2={x(max * tick / 4)} y1={18} y2={plotBottom} stroke="#DFEBE7" strokeDasharray="3 5" />
            <SvgText {...label} x={x(max * tick / 4)} y={plotBottom + 23} textAnchor="middle">{compactSalary(max * tick / 4)}</SvgText>
          </G>)}
          {clusters.map((group, i) => <G key={group.group}>
            <Line x1={45} x2={width - 20} y1={y(i)} y2={y(i)} stroke="#DCEAE6" strokeDasharray="3 5" />
            <SvgText {...label} x={34} y={y(i) + 4} textAnchor="end">T{i + 1}</SvgText>
            {group.salaries.map((salary, j) => <Circle key={j} cx={x(salary)} cy={y(i) + ((j * 17 + i * 13) % 25) - 12} r={5} fill={chartColor(i)} fillOpacity={0.85} stroke="white" strokeWidth={1.2} accessibilityLabel={`Tier ${i + 1}, ${formatTHB(salary)}`} />)}
            {group.count > 0 && <>
              <Circle cx={x(group.centroid)} cy={y(i)} r={9} fill="white" stroke={chartColor(i)} strokeWidth={3} />
              <Circle cx={x(group.centroid)} cy={y(i)} r={4} fill={colors.text} />
            </>}
          </G>)}
          <Line x1={45} x2={width - 20} y1={plotBottom} y2={plotBottom} stroke="#ADC6C5" />
          <SvgText {...label} x={width / 2} y={height - 8} textAnchor="middle">Monthly salary (THB)</SvgText>
        </Svg>
      </View>}
    <View style={styles.legend}>{clusters.map((group, i) => <View key={group.group} style={styles.key}><View style={[styles.dot, { backgroundColor: chartColor(i) }]} /><Text style={styles.legendText}>Tier {i + 1}</Text></View>)}
      <View style={styles.key}><View style={[styles.dot, { backgroundColor: colors.text }]} /><Text style={styles.legendText}>Centroid</Text></View>
    </View>
    <View style={styles.note}><ChartNote>X = salary (THB) · Y = assigned salary tier. Vertical spacing separates overlapping points for readability. K-Means uses salary only.</ChartNote></View>
  </ChartPanel>;
}
const styles = StyleSheet.create({
  visual: { borderWidth: 1, borderColor: '#E6F0EE', borderRadius: 11, backgroundColor: '#F8FBFA', overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, key: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 }, legendText: { fontSize: 12, color: colors.muted },
  note: { backgroundColor: '#EEF6F3', padding: 10, borderRadius: 8 },
});

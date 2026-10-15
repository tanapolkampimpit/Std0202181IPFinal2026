import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Typography';
import { colors, tierColors } from '../theme';

export const chartColor = (index) => tierColors[index % tierColors.length].accent;
export const compactSalary = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
export function ChartNote({ children }) { return <Text style={styles.note}>{children}</Text>; }
export default function ChartPanel({ number, type, title, tag, children }) {
  return <View testID={`salary-chart-${number}`} style={styles.panel}>
    <View style={styles.header}><View style={styles.identity}>
      <Text style={styles.overline}>CHART {String(number).padStart(2, '0')} · {type}</Text>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    </View><Text style={styles.tag}>{tag}</Text></View>
    {children}
  </View>;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: 15, padding: 14, gap: 15 },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  identity: { flexShrink: 1, gap: 4 }, overline: { color: colors.teal, fontWeight: '800', fontSize: 12, letterSpacing: 0.7 },
  title: { color: colors.text, fontWeight: '700', fontSize: 15 },
  tag: { color: '#486F68', backgroundColor: '#EDF7F3', borderRadius: 8, padding: 6, fontSize: 12 },
  note: { fontSize: 12, color: colors.muted, lineHeight: 19 },
});

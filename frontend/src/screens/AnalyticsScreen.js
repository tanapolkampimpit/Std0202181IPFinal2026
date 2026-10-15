import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button, Feedback, Icon, ui } from '../components/ui';
import { colors, formatTHB } from '../theme';

export default function AnalyticsScreen({ onBack }) {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clusters, setClusters] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const version = useRef(0);
  const analyze = useCallback(async () => {
    const requestVersion = ++version.current;
    setLoading(true); setError(''); setClusters(null);
    try {
      const response = await api('/api/employees/salary-clusters');
      if (!response?.success || response.clusters?.length !== 3) throw new Error('Salary analysis could not be read. Please retry.');
      if (version.current === requestVersion) { setClusters(response.clusters); setUpdatedAt(new Date()); }
    } catch (failure) { if (version.current === requestVersion) setError(failure.message); }
    finally { if (version.current === requestVersion) setLoading(false); }
  }, [api]);
  useEffect(() => { analyze(); return () => { version.current += 1; }; }, [analyze]);
  const total = clusters?.reduce((sum, cluster) => sum + cluster.count, 0) || 0;
  return <ScrollView style={ui.page} contentContainerStyle={ui.content}>
    <View style={styles.top}><Button title="Back to team" icon="arrow-back" variant="secondary" onPress={onBack} /><View style={styles.icon}><Icon name="stats-chart-outline" /></View></View>
    <View style={styles.intro}><Text style={ui.eyebrow}>SALARY INTELLIGENCE</Text><Text accessibilityRole="header" style={styles.heading}>A clearer picture{ '\n' }of your payroll.</Text><Text style={ui.body}>Three salary tiers, calculated from your current team’s monthly base salaries.</Text></View>
    {loading && <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Analyzing salaries" /><Text style={ui.title}>Analyzing salary structure…</Text><Text style={ui.body}>Finding the patterns in your team’s salaries.</Text></View>}
    <Feedback message={error} retry={analyze} />
    {!loading && clusters && <>
      <View style={styles.summary}><View><Text style={styles.summaryNumber}>{total}</Text><Text style={styles.summaryLabel}>Employees analyzed</Text></View><Icon name="people-outline" color={colors.onBlue} size={32} /></View>
      <View style={styles.labelRow}><Text accessibilityRole="header" style={ui.title}>Salary distribution</Text><Text style={styles.currency}>THB / MONTH</Text></View>
      {clusters.map((cluster, index) => <View style={styles.card} key={cluster.group}>
        <View style={styles.labelRow}><View style={ui.row}><View style={[styles.tierIndex, index === 2 && styles.topTier]}><Text style={[styles.tierNumber, index === 2 && { color: colors.surface }]}>{index + 1}</Text></View><View><Text style={ui.title}>{cluster.group}</Text><Text style={ui.body}>{['Lower salary range', 'Middle salary range', 'Upper salary range'][index]}</Text></View></View><Icon name="layers-outline" color={colors.muted} /></View>
        <Text style={styles.salary}>{formatTHB(cluster.centroid)}</Text><Text style={ui.body}>Average base salary (centroid)</Text>
        <View style={styles.cardFooter}><Text style={styles.count}>{cluster.count} {cluster.count === 1 ? 'employee' : 'employees'}</Text><Text style={styles.percentage}>{total ? Math.round(cluster.count / total * 100) : 0}% of team</Text></View>
      </View>)}
      {total === 0 && <View style={styles.empty}><Text style={ui.title}>No salaries to analyze yet</Text><Text style={ui.body}>Add an employee from your dashboard to see salary tiers.</Text></View>}
      <View style={styles.note}><Icon name="information-circle-outline" size={18} color={colors.muted} /><Text style={styles.noteText}>Tiers group similar salaries, from lowest to highest. Empty tiers show —. These groups describe salary distribution, not employee performance.</Text></View>
      <Text style={styles.timestamp}>Last analyzed at {updatedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      <Button title="Refresh analysis" icon="refresh-outline" variant="secondary" onPress={analyze} />
    </>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, icon: { width: 44, height: 44, backgroundColor: colors.lightBlue, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, intro: { gap: 12, marginVertical: 8 },
  heading: { color: colors.text, fontSize: 30, fontWeight: '700', letterSpacing: -1, lineHeight: 38 }, loading: { alignItems: 'center', paddingVertical: 48, gap: 16 }, summary: { backgroundColor: colors.darkBlue, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryNumber: { fontSize: 36, color: colors.surface, fontWeight: '700', fontVariant: ['tabular-nums'] }, summaryLabel: { fontSize: 13, color: colors.onBlue, marginTop: 4 }, labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, currency: { fontSize: 9, color: colors.muted, fontWeight: '700', letterSpacing: 0.8 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, gap: 8 }, tierIndex: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightBlue }, topTier: { backgroundColor: colors.primary }, tierNumber: { fontSize: 16, fontWeight: '700', color: colors.primary },
  salary: { fontSize: 29, fontWeight: '700', fontVariant: ['tabular-nums'], color: colors.text, letterSpacing: -0.8, marginTop: 12 }, cardFooter: { paddingTop: 16, marginTop: 8, borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' }, count: { color: colors.text, fontSize: 13, fontWeight: '600' }, percentage: { fontSize: 12, color: colors.muted },
  note: { flexDirection: 'row', gap: 8 }, noteText: { flex: 1, fontSize: 12, lineHeight: 19, color: colors.muted }, timestamp: { textAlign: 'center', color: colors.muted, fontSize: 11 }, empty: { gap: 8 },
});

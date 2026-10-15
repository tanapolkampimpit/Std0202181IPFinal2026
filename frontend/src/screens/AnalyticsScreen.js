import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button, Feedback, Icon, ui } from '../components/ui';
import AppHeader from '../components/AppHeader';
import SalaryChart from '../components/SalaryChart';
import { colors, formatTHB, shadow, tierColors } from '../theme';

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
      if (!response?.success || response.clusters?.length !== 3 || response.clusters.some((cluster) => !Number.isInteger(cluster.count) || cluster.count < 0 || (cluster.centroid !== null && (!Number.isFinite(cluster.centroid) || cluster.centroid <= 0)))) throw new Error('Salary analysis could not be read. Please retry.');
      if (version.current === requestVersion) { setClusters(response.clusters); setUpdatedAt(new Date()); }
    } catch (failure) { if (version.current === requestVersion) setError(failure.message); }
    finally { if (version.current === requestVersion) setLoading(false); }
  }, [api]);
  useEffect(() => { analyze(); return () => { version.current += 1; }; }, [analyze]);
  const total = clusters?.reduce((sum, cluster) => sum + cluster.count, 0) || 0;
  return <View style={ui.page}>
    <AppHeader onBack={onBack} />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <View style={styles.introIcon}><Icon name="stats-chart-outline" size={29} color={colors.teal} /></View>
        <View style={styles.flex}><Text accessibilityRole="header" style={styles.heading}>Salary Analytics</Text><Text style={styles.introText}>Analyze employee salary structure using K-Means Clustering</Text></View>
        <Icon name="information-circle-outline" size={17} color={colors.teal} />
      </View>
      <View style={styles.labelRow}><View style={styles.flex}><Text accessibilityRole="header" style={styles.resultHeading}>Analysis Result</Text><Text style={styles.subtitle}>{clusters ? `3 salary groups · ${total} ${total === 1 ? 'employee' : 'employees'} analyzed` : '3 salary groups based on current employees'}</Text></View><Text style={styles.kPill}>K = 3</Text></View>
      {loading && <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Analyzing salaries" /><Text style={ui.body}>Analyzing salary structure…</Text></View>}
      <Feedback message={error} retry={analyze} />
      {!loading && clusters && <>
        {clusters.map((cluster, index) => <View key={cluster.group} style={[styles.cluster, { backgroundColor: tierColors[index].tint, borderLeftColor: tierColors[index].accent }]}>
          <View style={[styles.clusterIcon, { backgroundColor: tierColors[index].icon }]}><Icon name="people-outline" color={index === 0 ? colors.successText : index === 1 ? colors.blue : colors.purple} size={22} /></View>
          <View style={styles.clusterIdentity}><Text style={styles.clusterName}>Group {index + 1} ({['Low', 'Medium', 'High'][index]})</Text><Text style={styles.clusterCount}>{cluster.count} {cluster.count === 1 ? 'employee' : 'employees'}</Text></View>
          <View style={styles.clusterValue}><Text style={styles.averageLabel}>Average Salary</Text><Text style={styles.salary} adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1}>{formatTHB(cluster.centroid, true)}</Text></View>
        </View>)}
        {total === 0 && <View style={styles.empty}><Text style={ui.title}>No salaries to analyze yet</Text><Text style={ui.body}>Add an employee from your dashboard to see salary groups.</Text></View>}
        <SalaryChart clusters={clusters} />
      </>}
      <Button title="Analyze Salary Structure" accessibilityLabel={clusters ? 'Refresh analysis' : 'Analyze Salary Structure'} icon="refresh-outline" onPress={analyze} loading={loading} style={styles.analyze} />
      <Text style={styles.note}>Calculated from current employee salaries. Groups describe salary distribution, not employee performance.</Text>
      {updatedAt && <Text style={styles.timestamp}>Last analyzed at {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 14, paddingBottom: 28, gap: 11 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, backgroundColor: colors.surface, borderRadius: 16, marginBottom: 2, ...shadow }, introIcon: { width: 54, height: 54, backgroundColor: '#E4F4EE', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 }, heading: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 5 }, introText: { color: colors.muted, fontSize: 11, lineHeight: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 3, paddingHorizontal: 3 }, resultHeading: { color: colors.text, fontSize: 16, fontWeight: '800' }, subtitle: { color: colors.muted, fontSize: 10, lineHeight: 17, marginTop: 4 }, kPill: { color: colors.deep, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 9, padding: 10, fontSize: 11 },
  loading: { alignItems: 'center', paddingVertical: 55, gap: 16 }, cluster: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, minHeight: 79, borderRadius: 12, borderLeftWidth: 5, paddingVertical: 12, paddingHorizontal: 11 },
  clusterIcon: { width: 39, height: 39, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }, clusterIdentity: { flex: 1, minWidth: 100, gap: 7 }, clusterName: { color: colors.text, fontSize: 12, fontWeight: '700' }, clusterCount: { color: colors.muted, fontSize: 10 },
  clusterValue: { marginLeft: 'auto', alignItems: 'flex-end', gap: 5, maxWidth: 145 }, averageLabel: { color: colors.muted, fontSize: 9 }, salary: { color: colors.text, fontWeight: '800', fontSize: 15, fontVariant: ['tabular-nums'] },
  analyze: { borderRadius: 99, marginTop: 2 }, note: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'center' }, timestamp: { textAlign: 'center', color: colors.muted, fontSize: 10 }, empty: { padding: 16, gap: 8, backgroundColor: colors.surface, borderRadius: 12 },
});

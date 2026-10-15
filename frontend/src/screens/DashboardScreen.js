import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Brand, Button, Feedback, Icon, ui } from '../components/ui';
import EmployeeCard from '../components/EmployeeCard';
import AddEmployeeModal from '../components/AddEmployeeModal';
import SummaryCards from '../components/SummaryCards';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import useEmployees from '../hooks/useEmployees';

export default function DashboardScreen({ onAnalyze }) {
  const { api, logout } = useAuth();
  const { employees, loading, busy, error, notice, reload, add, toggle, remove } = useEmployees(api);
  const [adding, setAdding] = useState(false);
  const [webDelete, setWebDelete] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  // Once a successful list response arrives, preserve counts during refreshes.
  React.useEffect(() => { if (!loading && !error) setHasLoaded(true); }, [loading, error]);
  function confirmDelete(employee) {
    if (Platform.OS === 'web') { setWebDelete(employee); return; }
    Alert.alert('Delete employee?', `Remove ${employee.name} from your team? This also updates salary analytics.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(employee).catch(() => {}) },
    ]);
  }
  const header = <View style={styles.headerContent}>
    <View style={styles.hero}>
      <View style={styles.topbar}><Brand light /><Button title="Logout" icon="log-out-outline" variant="secondary" onPress={logout} /></View>
      <Text style={styles.eyebrow}>YOUR PEOPLE, AT A GLANCE</Text>
      <Text accessibilityRole="header" style={styles.greeting}>Welcome back, Admin</Text>
      <Text style={styles.heroText}>A clear view of your team. A confident next step.</Text>
      <View style={styles.heroFooter}><Icon name="business-outline" size={15} color={colors.onBlue} /><Text style={styles.heroFooterText}>WORKFORCE OVERVIEW</Text></View>
    </View>
    <View style={styles.section}>
      <SummaryCards employees={employees} loaded={hasLoaded || employees.length > 0} />
      <View style={styles.analytics}>
        <View style={ui.row}><View style={styles.analyticsIcon}><Icon name="stats-chart-outline" size={24} /></View><View style={styles.flex}><Text style={ui.title}>Make sense of salaries</Text><Text style={ui.body}>Explore your team’s three salary tiers.</Text></View></View>
        <Button title="Analyze Salary Structure" icon="arrow-forward-outline" variant="secondary" onPress={onAnalyze} disabled={busy} />
      </View>
      <Feedback message={error} retry={() => reload().catch(() => {})} />
      <Feedback message={notice} success />
      <View style={styles.listHeading}><View style={styles.flex}><Text accessibilityRole="header" style={ui.title}>Your team</Text><Text style={ui.body}>{hasLoaded ? `${employees.length} team members` : 'Employee directory'}</Text></View><Button title="Add Employee" icon="add" onPress={() => setAdding(true)} disabled={busy || loading} /></View>
      {busy && <View style={ui.row}><ActivityIndicator color={colors.primary} /><Text style={ui.body}>Saving changes…</Text></View>}
    </View>
  </View>;
  return <View style={ui.page}>
    <FlatList data={employees} keyExtractor={({ id }) => id} ListHeaderComponent={header} contentContainerStyle={styles.list}
      renderItem={({ item }) => <View style={styles.employee}><EmployeeCard employee={item} busy={busy || loading} onToggle={(employee) => toggle(employee).catch(() => {})} onDelete={confirmDelete} /></View>}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => !busy && reload().catch(() => {})} tintColor={colors.primary} enabled={!busy} />}
      ListEmptyComponent={loading ? <View style={styles.empty}><ActivityIndicator size="large" color={colors.primary} /><Text style={ui.body}>Loading your team…</Text></View> : !error ? <View style={styles.empty}><Icon name="people-outline" size={40} /><Text style={ui.title}>Your team starts here</Text><Text style={ui.body}>Add your first employee to get started.</Text></View> : null} />
    {adding && <AddEmployeeModal visible onClose={() => setAdding(false)} onSave={add} busy={busy} />}
    {/* Expo web preview uses a React Native Modal; iOS/Android always use Alert.alert above. */}
    <Modal visible={!!webDelete} transparent animationType="fade" onRequestClose={() => setWebDelete(null)}>
      <View style={styles.overlay}><View style={styles.dialog}><Text style={ui.title}>Delete employee?</Text><Text style={ui.body}>Remove {webDelete?.name} from your team? This also updates salary analytics.</Text><Button title="Cancel" variant="secondary" onPress={() => setWebDelete(null)} /><Button title="Delete" variant="danger" onPress={() => { const employee = webDelete; setWebDelete(null); remove(employee).catch(() => {}); }} /></View></View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  list: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingBottom: 28 }, headerContent: { gap: 20, marginBottom: 16 },
  hero: { backgroundColor: colors.darkBlue, padding: 20, gap: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }, topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  eyebrow: { color: colors.onBlue, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }, greeting: { fontSize: 26, color: colors.surface, fontWeight: '700', letterSpacing: -0.7 }, heroText: { color: colors.onBlue, fontSize: 13, lineHeight: 21 },
  heroFooter: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderColor: colors.headerPanel, marginTop: 8 }, heroFooterText: { fontSize: 9, fontWeight: '600', letterSpacing: 1.3, color: colors.onBlue },
  section: { paddingHorizontal: 20, gap: 20 }, analytics: { backgroundColor: colors.surface, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 16, gap: 16 }, analyticsIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightBlue },
  flex: { flex: 1 }, listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, employee: { paddingHorizontal: 20 },
  empty: { padding: 32, gap: 12, alignItems: 'center' }, overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.45)', padding: 24 }, dialog: { maxWidth: 400, width: '100%', backgroundColor: colors.surface, padding: 24, borderRadius: 20, gap: 16 },
});

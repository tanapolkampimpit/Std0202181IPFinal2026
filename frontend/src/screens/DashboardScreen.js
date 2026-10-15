import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Feedback, Icon, IconButton, ui } from '../components/ui';
import AppHeader from '../components/AppHeader';
import EmployeeCard from '../components/EmployeeCard';
import AddEmployeeModal from '../components/AddEmployeeModal';
import SummaryCards from '../components/SummaryCards';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import useEmployees from '../hooks/useEmployees';

export default function DashboardScreen({ onAnalyze, directoryOnly = false, onHome }) {
  const { api, username } = useAuth();
  const { employees, loading, busy, error, notice, reload, add, toggle, remove } = useEmployees(api);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [webDelete, setWebDelete] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const searchRef = useRef(null);
  React.useEffect(() => { if (!loading && !error) setHasLoaded(true); }, [loading, error]);
  const filtered = employees.filter((employee) => `${employee.name} ${employee.position}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const refresh = () => reload().catch(() => {});
  function confirmDelete(employee) {
    if (Platform.OS === 'web') { setWebDelete(employee); return; }
    Alert.alert('Delete employee?', `Remove ${employee.name} from your team? This also updates salary analytics.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(employee).catch(() => {}) },
    ]);
  }
  const date = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
  const header = <View style={styles.headerContent}>
    {!directoryOnly && <>
      <LinearGradient colors={[colors.primary, '#29897C']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.hero}>
        <View style={styles.heroCopy}><Text accessibilityRole="header" style={styles.greeting}>Hello, {username || 'there'}</Text>
          <Text style={styles.heroText}>Here is your workforce overview</Text>
          <View style={styles.date}><Icon name="calendar-outline" size={13} color={colors.onPrimary} /><Text style={styles.dateText}>{date}</Text></View>
        </View>
        <View style={styles.briefcase}><Icon name="briefcase-outline" color="#C6F0E2" size={47} /></View>
      </LinearGradient>
      <SummaryCards employees={employees} loaded={hasLoaded || employees.length > 0} />
    </>}
    <Feedback message={error} retry={refresh} /><Feedback message={notice} success />
    <View style={styles.listHeading}><View style={styles.flex}><Text accessibilityRole="header" style={ui.title}>Employees</Text><Text style={styles.subtitle}>Manage your team members</Text></View>
      <Button title="Add New" accessibilityLabel="Add Employee" icon="add-outline" onPress={() => setAdding(true)} disabled={busy || loading} style={styles.addButton} />
    </View>
    <View style={styles.searchRow}><View style={styles.searchBox}><Icon name="search-outline" color={colors.muted} size={18} />
      <TextInput ref={searchRef} value={query} onChangeText={setQuery} accessibilityLabel="Search employees" placeholder="Search name or position..." placeholderTextColor={colors.muted} style={styles.searchInput} autoCapitalize="none" autoCorrect={false} returnKeyType="search" />
    </View><IconButton label="Clear search" icon="options-outline" onPress={() => { setQuery(''); searchRef.current?.focus(); }} style={styles.clearButton} /></View>
    {busy && <View style={ui.row}><ActivityIndicator color={colors.primary} /><Text style={ui.body}>Saving changes…</Text></View>}
  </View>;
  return <View style={ui.page}>
    <AppHeader onHome={onHome} onRefresh={refresh} refreshing={loading || busy} />
    <FlatList data={filtered} keyExtractor={({ id }) => id} ListHeaderComponent={header} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
      renderItem={({ item, index }) => <EmployeeCard employee={item} index={index} busy={busy || loading} onToggle={(employee) => toggle(employee).catch(() => {})} onDelete={confirmDelete} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => !busy && refresh()} tintColor={colors.primary} enabled={!busy} />}
      ListEmptyComponent={loading ? <View style={styles.empty}><ActivityIndicator size="large" color={colors.primary} /><Text style={ui.body}>Loading your team…</Text></View> : !error ? <View style={styles.empty}><Icon name={query.trim() ? 'search-outline' : 'people-outline'} size={34} />
        <Text style={ui.title}>{query.trim() ? 'No employees found' : 'Your team starts here'}</Text>
        <Text style={styles.emptyText}>{query.trim() ? 'Try another name or position, or clear your search.' : 'Add your first employee to get started.'}</Text>
      </View> : null}
      ListFooterComponent={<View style={styles.footer}><Text style={styles.footnote}>{hasLoaded ? `${filtered.length} of ${employees.length} employees shown` : 'Employee directory'}</Text><Button title="Analyze Salary Structure" icon="stats-chart-outline" variant="secondary" onPress={onAnalyze} disabled={busy} style={styles.analyze} /></View>} />
    {adding && <AddEmployeeModal visible onClose={() => setAdding(false)} onSave={async (data) => { await add(data); setQuery(''); }} busy={busy} />}
    <Modal visible={!!webDelete} transparent animationType="fade" onRequestClose={() => setWebDelete(null)}>
      <View style={styles.overlay}><View style={styles.dialog} accessibilityViewIsModal role="dialog" aria-modal={true} aria-label="Delete employee">
        <View style={styles.dangerIcon}><Icon name="trash-outline" color={colors.danger} size={24} /></View>
        <Text accessibilityRole="header" style={ui.heading}>Delete employee?</Text><Text style={ui.body}>Remove {webDelete?.name} from your team? This also updates salary analytics.</Text>
        <View style={styles.dialogActions}><Button title="Cancel" variant="secondary" onPress={() => setWebDelete(null)} style={styles.flex} /><Button title="Delete" variant="danger" style={styles.flex} onPress={() => { const employee = webDelete; setWebDelete(null); remove(employee).catch(() => {}); }} /></View>
      </View></View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  list: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 14, paddingBottom: 24 }, headerContent: { gap: 13, marginBottom: 9 },
  hero: { borderRadius: 16, minHeight: 134, padding: 18, justifyContent: 'center', overflow: 'hidden' }, heroCopy: { zIndex: 1, gap: 7 },
  greeting: { fontSize: 20, color: colors.surface, fontWeight: '800', letterSpacing: -0.5 }, heroText: { color: colors.onPrimary, fontSize: 12 },
  date: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 12 }, dateText: { fontSize: 10, color: colors.onPrimary },
  briefcase: { position: 'absolute', width: 115, height: 115, right: -20, bottom: -27, borderRadius: 58, backgroundColor: 'rgba(164,238,213,0.22)', padding: 25 },
  flex: { flex: 1 }, listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  subtitle: { fontSize: 11, color: colors.muted, marginTop: 4 }, addButton: { paddingHorizontal: 12, minHeight: 42, borderRadius: 11 },
  searchRow: { flexDirection: 'row', gap: 9 }, searchBox: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 11, backgroundColor: '#EDF4F1' },
  searchInput: { minWidth: 0, flex: 1, color: colors.text, fontSize: 12, minHeight: 44, paddingVertical: 10, outlineWidth: 0 }, clearButton: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  separator: { height: 5 }, footer: { gap: 16, paddingTop: 14 }, footnote: { textAlign: 'center', color: colors.muted, fontSize: 10 }, analyze: { borderRadius: 99 },
  empty: { paddingVertical: 30, paddingHorizontal: 16, gap: 10, alignItems: 'center' }, emptyText: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 20 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(4,32,31,0.5)', padding: 20 }, dialog: { maxWidth: 400, width: '100%', backgroundColor: colors.surface, padding: 26, borderRadius: 22, gap: 14 },
  dangerIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.dangerTint, justifyContent: 'center', alignItems: 'center' }, dialogActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});

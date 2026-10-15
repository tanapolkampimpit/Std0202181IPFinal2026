import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Typography';
import { Button, IconButton } from './ui';
import { colors, fonts, formatTHB } from '../theme';

export default function EmployeeCard({ employee, busy, onEdit, onToggle, onDelete, index = 0 }) {
  const [open, setOpen] = useState(false);
  const active = employee.status === 'Active';
  const initials = employee.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join('').toUpperCase();
  function act(action) { setOpen(false); action(employee); }
  return <View style={[styles.card, employee.status === 'On Leave' && styles.onLeave]}>
    <View style={styles.row}>
      <View style={[styles.avatar, index % 3 === 2 && styles.alternateAvatar]}><Text style={styles.initials}>{initials}</Text></View>
      <View style={styles.identity}><Text style={styles.name} numberOfLines={1}>{employee.name}</Text><Text style={styles.position} numberOfLines={1}>{employee.position}</Text></View>
      <View style={styles.side}><Text style={styles.salary}>{formatTHB(employee.salary, true)}</Text>
        <View style={[styles.badge, { backgroundColor: active ? colors.successTint : colors.warningTint }]}><View style={[styles.dot, { backgroundColor: active ? colors.successText : colors.warningText }]} /><Text style={[styles.status, { color: active ? colors.successText : colors.warningText }]}>{employee.status}</Text></View>
      </View>
      <IconButton label={`Actions for ${employee.name}`} icon={open ? 'close-outline' : 'ellipsis-vertical'} expanded={open} disabled={busy} onPress={() => setOpen((current) => !current)} style={styles.menuButton} />
    </View>
    {open && <View style={styles.actions}>
      <Button title="Edit" accessibilityLabel={`Edit ${employee.name}`} icon="create-outline" variant="secondary" disabled={busy} onPress={() => act(onEdit)} />
      <Button title="Toggle Status" accessibilityLabel={`Toggle Status for ${employee.name}`} icon="swap-horizontal-outline" variant="secondary" disabled={busy} onPress={() => act(onToggle)} style={styles.toggle} />
      <Button title="Delete" accessibilityLabel={`Delete ${employee.name}`} icon="trash-outline" variant="danger" disabled={busy} onPress={() => act(onDelete)} />
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 9, paddingLeft: 10, paddingRight: 2, borderWidth: 1, borderColor: '#EFF5F2' },
  onLeave: { backgroundColor: colors.leaveBackground, borderColor: colors.warning },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 }, avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.avatar, alignItems: 'center', justifyContent: 'center' }, alternateAvatar: { backgroundColor: '#E5EBE6' },
  initials: { color: colors.primary, fontSize: 13, fontWeight: '800' }, identity: { flex: 1, minWidth: 0, gap: 5 },
  name: { color: colors.text, fontFamily: fonts.body, fontSize: 14, fontWeight: '700' }, position: { color: colors.muted, fontSize: 12 },
  side: { alignItems: 'flex-end', gap: 5 }, salary: { color: colors.text, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  badge: { flexDirection: 'row', gap: 4, alignItems: 'center', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 4 }, dot: { width: 4, height: 4, borderRadius: 2 }, status: { fontWeight: '500', fontSize: 9 },
  menuButton: { width: 32, minHeight: 44 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 9, marginTop: 9, marginRight: 8, borderTopWidth: 1, borderColor: colors.border }, toggle: { flexGrow: 1 },
});

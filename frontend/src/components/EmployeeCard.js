import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Typography';
import { Button, Icon, IconButton } from './ui';
import { colors, fonts, formatTHB } from '../theme';

export default function EmployeeCard({ employee, busy, onEdit, onToggle, onDelete, index = 0 }) {
  const [open, setOpen] = useState(false);
  const active = employee.status === 'Active';
  const initials = employee.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join('').toUpperCase();
  function act(action) { setOpen(false); action(employee); }
  return <View style={[styles.card, active ? styles.active : styles.onLeave]}>
    <View style={styles.row}>
      <View style={[styles.avatar, index % 3 === 2 && styles.alternateAvatar]}><Text style={styles.initials}>{initials}</Text></View>
      <View style={styles.identity}><Text style={styles.name} numberOfLines={1}>{employee.name}</Text><Text style={styles.position} numberOfLines={1}>{employee.position}</Text></View>
      <Text style={styles.salary}>{formatTHB(employee.salary, true)}</Text>
      <IconButton label={`Actions for ${employee.name}`} icon={open ? 'close-outline' : 'ellipsis-vertical'} expanded={open} disabled={busy} onPress={() => setOpen((current) => !current)} style={styles.menuButton} />
    </View>
    <View style={styles.statusRow}>
      <View style={styles.currentStatus}><Text style={styles.statusLabel}>Status</Text>
        <View accessibilityLabel={`${employee.name}: ${employee.status}`} style={[styles.badge, { backgroundColor: active ? colors.successTint : colors.warningTint, borderColor: active ? colors.successText : colors.warningText }]}>
          <Icon name={active ? 'checkmark-circle' : 'pause-circle'} size={18} color={active ? colors.successText : colors.warningText} />
          <Text style={[styles.status, { color: active ? colors.successText : colors.warningText }]}>{employee.status}</Text>
        </View>
      </View>
      <Button title={active ? 'Set On Leave' : 'Set Active'} accessibilityLabel={`Toggle Status for ${employee.name}`} icon={active ? 'pause-circle-outline' : 'checkmark-circle-outline'} disabled={busy} onPress={() => act(onToggle)} style={styles.toggle} />
    </View>
    {open && <View style={styles.actions}>
      <Button title="Edit" accessibilityLabel={`Edit ${employee.name}`} icon="create-outline" variant="secondary" disabled={busy} onPress={() => act(onEdit)} />
      <Button title="Delete" accessibilityLabel={`Delete ${employee.name}`} icon="trash-outline" variant="danger" disabled={busy} onPress={() => act(onDelete)} />
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 12, paddingLeft: 10, paddingRight: 8, borderWidth: 1, borderLeftWidth: 4, borderColor: colors.border },
  active: { borderLeftColor: colors.successText },
  onLeave: { backgroundColor: colors.leaveBackground, borderColor: colors.warning },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 }, avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.avatar, alignItems: 'center', justifyContent: 'center' }, alternateAvatar: { backgroundColor: '#E5EBE6' },
  initials: { color: colors.primary, fontSize: 13, fontWeight: '800' }, identity: { flex: 1, minWidth: 0, gap: 5 },
  name: { color: colors.text, fontFamily: fonts.body, fontSize: 14, fontWeight: '700' }, position: { color: colors.muted, fontSize: 12 },
  salary: { color: colors.text, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 12, marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  currentStatus: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, statusLabel: { color: colors.text, fontSize: 12, fontWeight: '600' },
  badge: { flexDirection: 'row', gap: 6, alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }, status: { fontWeight: '700', fontSize: 12 },
  menuButton: { width: 44, minHeight: 44 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 9, marginTop: 9, borderTopWidth: 1, borderColor: colors.border }, toggle: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginLeft: 'auto' },
});

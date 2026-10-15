import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Icon, IconButton, ui } from './ui';
import { Text } from './Typography';
import { colors } from '../theme';

export default function ClusterPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button title={`K = ${value}`} accessibilityLabel={`Choose number of salary groups, current K ${value}`} icon="chevron-down-outline" variant="secondary" onPress={() => setOpen(true)} style={styles.trigger} />
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}><View style={styles.dialog} accessibilityViewIsModal role="dialog" aria-modal={true} aria-label="Number of salary groups">
        <View style={styles.header}><Text accessibilityRole="header" style={ui.title}>Number of groups</Text><IconButton label="Close group selector" icon="close-outline" onPress={() => setOpen(false)} /></View>
        <Text style={ui.body}>Choose K from 1 to 10. Salary groups are recalculated when you select a value.</Text>
        <ScrollView contentContainerStyle={styles.options}>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((k) => <View key={k} style={[styles.option, k === value && styles.selected]}>
            <Button title={`${k} ${k === 1 ? 'group' : 'groups'}`} accessibilityLabel={`${k} salary ${k === 1 ? 'group' : 'groups'}`} onPress={() => { setOpen(false); onChange(k); }} variant="secondary" style={styles.optionButton} />
            {k === value && <View pointerEvents="none" style={styles.check}><Icon name="checkmark-outline" /></View>}
          </View>)}
        </ScrollView>
      </View></View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  trigger: { minHeight: 44, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(4,32,31,0.5)', padding: 20, justifyContent: 'center', alignItems: 'center' },
  dialog: { width: '100%', maxWidth: 420, maxHeight: '85%', padding: 22, borderRadius: 22, backgroundColor: colors.surface, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, options: { gap: 6, paddingVertical: 4 },
  option: { borderRadius: 12, borderWidth: 1, borderColor: 'transparent' }, selected: { borderColor: colors.teal }, optionButton: { minHeight: 46 }, check: { position: 'absolute', right: 16, top: 13 },
});

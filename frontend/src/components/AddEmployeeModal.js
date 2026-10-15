import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Feedback, Field, Icon, IconButton, ui } from './ui';
import { colors, shadow } from '../theme';
import { validateEmployee } from '../validation';

export default function AddEmployeeModal({ visible, onClose, onSave, busy }) {
  const [form, setForm] = useState({ name: '', position: '', salary: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  function change(key, value) { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: '' })); setError(''); }
  async function submit() {
    const validated = validateEmployee(form);
    setErrors(validated.errors);
    if (Object.keys(validated.errors).length) return;
    try { await onSave(validated.value); onClose(); }
    catch (failure) { setError(failure.message); setErrors(failure.fields || {}); }
  }
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !busy && onClose()}>
    <SafeAreaView style={styles.overlay}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.dialog} accessibilityViewIsModal role="dialog" aria-modal={true} aria-label="Add Employee">
            <View style={styles.header}><View style={styles.icon}><Icon name="people-outline" size={25} /></View><IconButton label="Close" icon="close-outline" onPress={onClose} disabled={busy} /></View>
            <View style={styles.intro}><Text accessibilityRole="header" style={ui.heading}>Add Employee</Text><Text style={ui.body}>Enter the details of your new team member.</Text></View>
            <Field label="Full name" placeholder="e.g. Somchai Jaidee" value={form.name} onChangeText={(value) => change('name', value)} error={errors.name} autoCapitalize="words" autoComplete="name" editable={!busy} maxLength={100} autoFocus />
            <Field label="Position" placeholder="e.g. Software Engineer" value={form.position} onChangeText={(value) => change('position', value)} error={errors.position} autoCapitalize="words" editable={!busy} maxLength={100} />
            <Field label="Monthly salary (THB)" placeholder="e.g. 45000" value={form.salary} onChangeText={(value) => change('salary', value)} error={errors.salary} keyboardType="decimal-pad" editable={!busy} />
            <Feedback message={error} />
            <View style={styles.actions}><Button title="Cancel" variant="secondary" onPress={onClose} disabled={busy} style={styles.flex} /><Button title={busy ? 'Saving…' : 'Save Employee'} accessibilityLabel="Save Employee" onPress={submit} loading={busy} style={styles.flex} /></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(4,32,31,0.5)' }, keyboard: { flex: 1 }, scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 }, dialog: { width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: colors.surface, borderRadius: 22, padding: 24, gap: 16, ...shadow },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, icon: { width: 48, height: 48, backgroundColor: '#E4F5EF', borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, intro: { gap: 6, marginBottom: 2 }, actions: { flexDirection: 'row', gap: 10, marginTop: 2 }, flex: { flex: 1 },
});

import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Feedback, Field, Icon, ui } from './ui';
import { colors } from '../theme';
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
  return <Modal visible={visible} animationType="slide" onRequestClose={() => !busy && onClose()} presentationStyle="pageSheet">
    <SafeAreaView style={ui.page}>
      <KeyboardAvoidingView style={ui.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>
          <View style={styles.header}><View style={styles.icon}><Icon name="person-add-outline" size={24} /></View><Button title="Cancel" variant="secondary" onPress={onClose} disabled={busy} /></View>
          <View style={styles.intro}><Text style={ui.eyebrow}>BUILD YOUR TEAM</Text><Text accessibilityRole="header" style={ui.heading}>Add employee</Text><Text style={ui.body}>Add a team member and their monthly base salary. Their status starts as Active.</Text></View>
          <View style={styles.form}>
            <Field label="Full name" placeholder="e.g. Somchai Jaidee" value={form.name} onChangeText={(value) => change('name', value)} error={errors.name} autoCapitalize="words" autoComplete="name" editable={!busy} maxLength={200} />
            <Field label="Position" placeholder="e.g. Software Engineer" value={form.position} onChangeText={(value) => change('position', value)} error={errors.position} autoCapitalize="words" editable={!busy} maxLength={200} />
            <Field label="Monthly salary (THB)" placeholder="e.g. 45000" value={form.salary} onChangeText={(value) => change('salary', value)} error={errors.salary} keyboardType="decimal-pad" editable={!busy} />
            <Feedback message={error} />
            <Button title={busy ? 'Saving employee…' : 'Add Employee'} icon="add-outline" onPress={submit} loading={busy} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, icon: { width: 52, height: 52, backgroundColor: colors.lightBlue, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  intro: { gap: 12 }, form: { padding: 20, backgroundColor: colors.surface, borderRadius: 16, gap: 20, borderColor: colors.border, borderWidth: 1 },
});

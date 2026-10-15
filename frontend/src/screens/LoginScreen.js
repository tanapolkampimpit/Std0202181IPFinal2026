import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Brand, Button, Feedback, Field, Icon, ui } from '../components/ui';
import { colors, shadow } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const passwordRef = useRef(null);
  async function submit() {
    if (lock.current) return;
    if (!username.trim() || !password) { setError('Enter your username and password to continue.'); return; }
    lock.current = true; setLoading(true); setError('');
    try { await login(username.trim(), password); }
    catch (failure) { setError(failure.message); Alert.alert('Sign in failed', failure.message); }
    finally { lock.current = false; setLoading(false); }
  }
  return <SafeAreaView style={ui.page}>
    <KeyboardAvoidingView style={ui.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}><Brand /><Text style={styles.tagline}>WORKFORCE MANAGEMENT</Text></View>
        <View style={styles.welcome}>
          <View style={styles.shield}><Icon name="shield-checkmark-outline" size={36} /></View>
          <Text accessibilityRole="header" style={styles.heading}>Good teams start here.</Text>
          <Text style={styles.subtitle}>Welcome to BlueHR. Sign in to keep your{ '\n' }people and payroll in focus.</Text>
        </View>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={ui.title}>Welcome back</Text>
          <Field label="Username" placeholder="Enter your username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} editable={!loading} />
          <Field label="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} editable={!loading} inputRef={passwordRef} />
          <Feedback message={error} />
          <Button title={loading ? 'Signing in…' : 'Sign In'} icon="arrow-forward-outline" loading={loading} disabled={!username.trim() || !password} onPress={submit} />
        </View>
        <View style={styles.footer}><Icon name="lock-closed-outline" size={14} color={colors.muted} /><Text style={styles.footerText}>Your team. One clear view.</Text></View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', padding: 24, justifyContent: 'center', gap: 32 },
  brand: { alignItems: 'center', gap: 12 }, tagline: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: colors.muted },
  welcome: { alignItems: 'center', gap: 16 }, shield: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.lightBlue, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 27, fontWeight: '700', letterSpacing: -0.8, textAlign: 'center', color: colors.text }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  card: { backgroundColor: colors.surface, padding: 24, borderRadius: 20, gap: 20, borderWidth: 1, borderColor: colors.border, ...shadow },
  footer: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' }, footerText: { color: colors.muted, fontSize: 12 },
});

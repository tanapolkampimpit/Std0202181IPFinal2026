import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { Brand, Button, Feedback, Icon, IconButton } from '../components/ui';
import { colors, fonts, shadow } from '../theme';

function LoginField({ label, icon, inputRef, trailing, ...props }) {
  const [focused, setFocused] = useState(false);
  return <View style={[styles.field, focused && styles.focused]}>
    <Icon name={icon} color={colors.deep} size={23} />
    <View style={styles.fieldContent}><Text style={styles.label}>{label}</Text>
      <TextInput ref={inputRef} accessibilityLabel={label} placeholderTextColor={colors.muted} {...props} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={styles.input} />
    </View>{trailing}
  </View>;
}
export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={styles.canvas}>
          <LinearGradient colors={['#207C77', '#06423E', '#0C655E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={[styles.orb, styles.orbLeft]} /><View style={[styles.orb, styles.orbRight]} />
            <Brand light large />
            <View style={styles.rule} />
            <Text style={styles.mantra}>Manage your team{ '\n' }Smarter, Easier, Together</Text>
            <Svg style={styles.wave} viewBox="0 0 375 100" preserveAspectRatio="none" accessible={false}>
              <Path d="M0 0 C85 7 100 66 190 58 C267 53 295 -8 375 5 L375 100 L0 100Z" fill="#F3FAF8" />
              <Path d="M0 40 C70 14 140 90 225 80 C300 72 340 30 375 36 L375 100 L0 100Z" fill="#E7F4F0" opacity={0.75} />
            </Svg>
          </LinearGradient>
          <View style={styles.card}>
            <LoginField label="Username" icon="person-outline" placeholder="Enter username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} editable={!loading} />
            <LoginField label="Password" icon="lock-closed-outline" placeholder="Enter password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} editable={!loading} inputRef={passwordRef}
              trailing={<IconButton label={showPassword ? 'Hide password' : 'Show password'} icon={showPassword ? 'eye-off-outline' : 'eye-outline'} onPress={() => setShowPassword((current) => !current)} disabled={loading} />} />
            <View style={styles.secure}><Icon name="shield-checkmark-outline" size={16} /><Text style={styles.secureText}>Secure access to your workspace</Text></View>
            <Feedback message={error} />
            <View><Button title={loading ? 'Signing in…' : 'Sign In'} loading={loading} disabled={!username.trim() || !password} onPress={submit} style={styles.submit} />
              {!loading && <View pointerEvents="none" style={styles.arrow}><Icon name="arrow-forward-outline" color={colors.deep} size={23} /></View>}
            </View>
            <View style={styles.help}><View style={styles.helpRule} /><Text style={styles.helpText}>Secure access</Text><View style={styles.helpRule} /></View>
            <Text style={styles.support}>Use the account provided by your administrator</Text>
          </View>
          <View style={styles.dots} accessible={false}>{Array.from({ length: 6 }, (_, i) => <View key={i} style={styles.dot} />)}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary }, root: { flex: 1, backgroundColor: '#E7F2EF' },
  scroll: { flexGrow: 1, alignItems: 'center' }, canvas: { width: '100%', maxWidth: 520, paddingBottom: 28, flexGrow: 1, backgroundColor: '#EAF5F1' },
  hero: { height: 358, alignItems: 'center', paddingTop: 86, overflow: 'hidden' },
  orb: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(159,234,219,0.07)' }, orbLeft: { left: -145, top: -155 }, orbRight: { right: -162, top: 85 },
  rule: { height: 3, width: 38, backgroundColor: '#B9E3D6', marginTop: 28, marginBottom: 16, borderRadius: 5 },
  mantra: { fontFamily: fonts.body, color: colors.surface, fontSize: 16, lineHeight: 28, textAlign: 'center' },
  wave: { position: 'absolute', bottom: -1, left: 0, width: '100%', height: 104 },
  card: { marginHorizontal: 16, marginTop: -11, padding: 22, gap: 13, borderRadius: 24, backgroundColor: colors.surface, ...shadow },
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 64, borderWidth: 1, borderColor: colors.border, borderRadius: 15, paddingLeft: 14, paddingRight: 4, gap: 12, backgroundColor: '#FCFEFD' },
  focused: { borderColor: colors.teal }, fieldContent: { flex: 1, minWidth: 0, paddingVertical: 9 }, label: { fontFamily: fonts.body, fontSize: 11, color: colors.deep, marginBottom: 3 },
  input: { fontFamily: fonts.body, fontSize: 15, fontWeight: '600', color: colors.text, padding: 0, minHeight: 26, outlineWidth: 0 },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 7, marginVertical: 2 }, secureText: { color: colors.deep, fontSize: 11 },
  submit: { borderRadius: 99, minHeight: 54 }, arrow: { position: 'absolute', right: 8, top: 8, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  help: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 8, marginTop: 4 }, helpRule: { flex: 1, height: 1, backgroundColor: colors.border }, helpText: { fontSize: 11, color: colors.muted },
  support: { textAlign: 'center', color: colors.muted, fontSize: 10, lineHeight: 16 }, dots: { width: 38, flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginLeft: 52, marginTop: 25 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#6DB6AA' },
});

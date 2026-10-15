import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text as NativeText, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import { Icon } from './src/components/ui';
import { Text } from './src/components/Typography';
import { fontAssets } from './src/fonts';
import { colors } from './src/theme';

function Workspace() {
  const { logout } = useAuth();
  const [screen, setScreen] = useState('home');
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen !== 'home') { setScreen('home'); return true; }
      return false;
    });
    return () => handler.remove();
  }, [screen]);
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-outline' },
    { id: 'employees', label: 'Employees', icon: 'people-outline' },
    { id: 'analytics', label: 'Analytics', icon: 'stats-chart-outline' },
    { id: 'logout', label: 'Logout', icon: 'log-out-outline' },
  ];
  return <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.content}>{screen === 'analytics' ? <AnalyticsScreen onBack={() => setScreen('home')} /> : <DashboardScreen directoryOnly={screen === 'employees'} onHome={() => setScreen('home')} onAnalyze={() => setScreen('analytics')} />}</View>
    <View style={styles.navigation}><View style={styles.navigationInner} accessibilityRole="tablist">{tabs.map((tab) => <Pressable key={tab.id} accessibilityRole={tab.id === 'logout' ? 'button' : 'tab'} accessibilityState={tab.id === 'logout' ? {} : { selected: screen === tab.id }} accessibilityLabel={tab.label}
      onPress={tab.id === 'logout' ? logout : () => setScreen(tab.id)} style={({ pressed, focused }) => [styles.tab, pressed && styles.pressed, focused && styles.focused]}>
      <Icon name={tab.icon} size={21} color={screen === tab.id ? colors.primary : colors.muted} /><Text style={[styles.tabText, screen === tab.id && styles.active]}>{tab.label}</Text>
    </Pressable>)}</View></View>
  </SafeAreaView>;
}
function AuthGate() {
  const { token, restoring } = useAuth();
  if (restoring) return <View style={styles.fontLoading}><ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Restoring session" /></View>;
  return token ? <Workspace /> : <><StatusBar style="light" /><LoginScreen /></>;
}
function FontReadyApp({ onRetry }) {
  const [loaded, error] = useFonts(fontAssets);
  if (error) return <View style={styles.fontLoading}>
    <NativeText style={styles.fontError}>Unable to load app fonts.</NativeText>
    <Pressable accessibilityRole="button" accessibilityLabel="Retry loading fonts" onPress={onRetry} style={styles.fontRetry}><NativeText style={styles.fontError}>Try again</NativeText></Pressable>
  </View>;
  if (!loaded) return <View style={styles.fontLoading}><ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading app fonts" /></View>;
  return <SafeAreaProvider><AuthProvider><AuthGate /></AuthProvider></SafeAreaProvider>;
}
export default function App() {
  const [fontAttempt, setFontAttempt] = useState(0);
  return <FontReadyApp key={fontAttempt} onRetry={() => setFontAttempt((value) => value + 1)} />;
}
const styles = StyleSheet.create({
  fontLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: colors.background }, fontError: { fontSize: 16, color: colors.text }, fontRetry: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: colors.primary, borderRadius: 12 },
  root: { flex: 1, backgroundColor: colors.surface }, content: { flex: 1 },
  navigation: { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border }, navigationInner: { width: '100%', maxWidth: 760, alignSelf: 'center', flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10 },
  tab: { flex: 1, minHeight: 48, gap: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }, tabText: { color: colors.muted, fontSize: 12 }, active: { color: colors.primary, fontWeight: '700' }, pressed: { opacity: 0.6 }, focused: { outlineWidth: 2, outlineColor: colors.teal },
});

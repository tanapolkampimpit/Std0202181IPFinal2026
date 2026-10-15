import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import { Icon } from './src/components/ui';
import { colors } from './src/theme';

function Workspace() {
  const [screen, setScreen] = useState('team');
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'analytics') { setScreen('team'); return true; }
      return false;
    });
    return () => handler.remove();
  }, [screen]);
  return <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.content}>{screen === 'team' ? <DashboardScreen onAnalyze={() => setScreen('analytics')} /> : <AnalyticsScreen onBack={() => setScreen('team')} />}</View>
    <View style={styles.navigation} accessibilityRole="tablist">{[
      { id: 'team', label: 'Employees', icon: 'people-outline' },
      { id: 'analytics', label: 'Analytics', icon: 'stats-chart-outline' },
    ].map((tab) => <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: screen === tab.id }} accessibilityLabel={tab.label} onPress={() => setScreen(tab.id)} style={({ pressed }) => [styles.tab, pressed && { opacity: 0.6 }]}>
      <Icon name={tab.icon} color={screen === tab.id ? colors.primary : colors.muted} /><Text style={[styles.tabText, screen === tab.id && { color: colors.primary, fontWeight: '700' }]}>{tab.label}</Text>
    </Pressable>)}</View>
  </SafeAreaView>;
}
function AuthGate() {
  const { token } = useAuth();
  // Protected screens cannot mount (or call employee APIs) before login.
  return token ? <Workspace /> : <><StatusBar style="dark" /><LoginScreen /></>;
}
export default function App() {
  return <SafeAreaProvider><AuthProvider><AuthGate /></AuthProvider></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, content: { flex: 1 },
  navigation: { backgroundColor: colors.surface, flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 20, justifyContent: 'center' }, tab: { flex: 1, maxWidth: 280, minHeight: 48, gap: 5, alignItems: 'center', justifyContent: 'center' }, tabText: { color: colors.muted, fontSize: 11 },
});

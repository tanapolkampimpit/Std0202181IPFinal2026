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
  const { token } = useAuth();
  return token ? <Workspace /> : <><StatusBar style="light" /><LoginScreen /></>;
}
export default function App() {
  return <SafeAreaProvider><AuthProvider><AuthGate /></AuthProvider></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, content: { flex: 1 },
  navigation: { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border }, navigationInner: { width: '100%', maxWidth: 760, alignSelf: 'center', flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10 },
  tab: { flex: 1, minHeight: 48, gap: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }, tabText: { color: colors.muted, fontSize: 10 }, active: { color: colors.primary, fontWeight: '700' }, pressed: { opacity: 0.6 }, focused: { outlineWidth: 2, outlineColor: colors.teal },
});

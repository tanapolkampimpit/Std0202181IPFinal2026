import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Brand, IconButton } from './ui';
import { colors } from '../theme';

export default function AppHeader({ onBack, onHome, onRefresh, refreshing }) {
  return <View style={styles.header}><View style={styles.inner}>
    <IconButton label={onBack ? 'Back to team' : 'Home'} icon={onBack ? 'arrow-back-outline' : 'home-outline'} onPress={onBack ?? onHome} />
    <Brand />
    {onRefresh ? <IconButton label="Refresh employees" icon="refresh-outline" onPress={onRefresh} disabled={refreshing} /> : <View style={styles.spacer} />}
  </View></View>;
}
const styles = StyleSheet.create({
  header: { backgroundColor: colors.surface }, inner: { width: '100%', maxWidth: 760, alignSelf: 'center', height: 60, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, spacer: { width: 44 },
});

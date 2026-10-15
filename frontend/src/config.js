import { Platform } from 'react-native';

// Expo replaces this exact EXPO_PUBLIC_* access at bundle time.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

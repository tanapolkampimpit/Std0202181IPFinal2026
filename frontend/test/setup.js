jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: jest.requireActual('react-native').View }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

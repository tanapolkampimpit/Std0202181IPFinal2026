jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: jest.requireActual('react-native').View }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-secure-store', () => {
  const storage = new Map();
  return {
    __storage: storage,
    getItemAsync: jest.fn(async (key) => storage.get(key) ?? null),
    setItemAsync: jest.fn(async (key, value) => { storage.set(key, value); }),
    deleteItemAsync: jest.fn(async (key) => { storage.delete(key); }),
  };
});
beforeEach(() => { require('expo-secure-store').__storage.clear(); });

import { Platform } from 'react-native';

export const colors = {
  primary: '#0D5149', deep: '#103F3C', teal: '#268F7C', mint: '#7FDBBC',
  background: '#F6FAF9', mist: '#EEF7F5', surface: '#FFFFFF', text: '#102C33',
  muted: '#607984', border: '#DFE9E8', success: '#11975C', warning: '#DB8B0A',
  danger: '#BF3030', successTint: '#E2F7EC', warningTint: '#FFF0D5',
  leaveBackground: '#FFF4B8',
  dangerTint: '#FFF0F0', successText: '#087A50', warningText: '#94600A',
  onPrimary: '#DDF4EF', avatar: '#D4EDE7', subtle: '#F0F6F4',
  blue: '#4089D8', purple: '#9559CE', blueTint: '#EAF4FE', purpleTint: '#F3ECFB',
};
export const tierColors = [
  { accent: '#087F5B', tint: '#EAF7F1', icon: '#D8F3E4' },
  { accent: '#2563EB', tint: '#EFF4FF', icon: '#DCE7FF' },
  { accent: '#7C3AED', tint: '#F4EFFF', icon: '#E9DDFF' },
  { accent: '#C65B00', tint: '#FFF4E8', icon: '#FFE3C2' },
  { accent: '#D12D43', tint: '#FFF0F2', icon: '#FFDCE2' },
  { accent: '#007C91', tint: '#EAF8FB', icon: '#CDEEF4' },
  { accent: '#BE267A', tint: '#FFF0F8', icon: '#FAD9EB' },
  { accent: '#6F7600', tint: '#F6F8E8', icon: '#E8EDBF' },
  { accent: '#89532B', tint: '#FAF1EA', icon: '#EFDDCE' },
  { accent: '#45536D', tint: '#EFF2F7', icon: '#DCE2EE' },
];
export const fonts = {
  body: 'NotoSansThai_400Regular',
  medium: 'NotoSansThai_500Medium',
  semibold: 'NotoSansThai_600SemiBold',
  bold: 'NotoSansThai_700Bold',
  extrabold: 'NotoSansThai_800ExtraBold',
  data: 'NotoSansThai_500Medium',
  logo: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
};
export const shadow = { shadowColor: colors.deep, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 2 };

export function formatTHB(value, compact = false) {
  if (value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: compact && Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value);
}

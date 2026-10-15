import { Platform } from 'react-native';

export const colors = {
  primary: '#2563EB', darkBlue: '#1E3A8A', lightBlue: '#EFF6FF', background: '#F5F8FE',
  surface: '#FFFFFF', text: '#0F172A', muted: '#64748B', success: '#16A34A',
  warning: '#D97706', danger: '#DC2626', border: '#E2E8F0',
  successTint: '#F0FDF4', warningTint: '#FFFBEB', dangerTint: '#FEF2F2',
  successText: '#166534', warningText: '#92400E', onBlue: '#DBEAFE', headerPanel: '#244695',
};
export const fonts = {
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
  data: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};
export const shadow = { shadowColor: colors.darkBlue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 };

export function formatTHB(value) {
  if (value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

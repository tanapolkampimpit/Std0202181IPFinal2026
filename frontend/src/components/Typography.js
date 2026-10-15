import React, { forwardRef } from 'react';
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput } from 'react-native';
import { colors, fonts } from '../theme';

// Use an actual bundled face for each weight on Android, iOS and web.
// Shared defaults also cover captions, chart labels and input placeholders.
function textStyle(style, input = false) {
  const flat = StyleSheet.flatten(style) ?? {};
  const weight = flat.fontWeight === 'bold' ? 700 : Number(flat.fontWeight) || 400;
  const fontFamily = weight >= 800 ? fonts.extrabold : weight >= 700 ? fonts.bold : weight >= 600 ? fonts.semibold : weight >= 500 ? fonts.medium : fonts.body;
  const fontSize = Math.max(input ? 16 : 12, flat.fontSize ?? (input ? 16 : 14));
  return {
    color: colors.text,
    ...flat,
    fontSize,
    lineHeight: Math.max(flat.lineHeight ?? 0, Math.ceil(fontSize * 1.5)),
    fontFamily,
    fontWeight: 'normal',
  };
}

export const Text = forwardRef(function Text({ style, ...props }, ref) {
  return <NativeText ref={ref} {...props} style={textStyle(style)} />;
});

export const TextInput = forwardRef(function TextInput({ style, ...props }, ref) {
  return <NativeTextInput ref={ref} {...props} style={textStyle(style, true)} />;
});

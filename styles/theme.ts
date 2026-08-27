/**
 * The Pharaoh's Chariot - React Native Theme and Style Guide
 *
 * This file defines the core design tokens for the application,
 * implementing the "Luxury with Ancient Egyptian Touch" aesthetic.
 *
 * CRITICAL: Ensure this file is properly imported in your app and that
 * the theme is applied to all screens. The PRIMARY_DARK color (#F5E6D3)
 * is the cream/beige background that should display throughout the app.
 *
 * Usage: import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS, BORDER_RADIUS, GLOBAL_STYLES } from './theme';
 */

import { StyleSheet, TextStyle } from 'react-native';

// --- COLOR PALETTE ---
export const COLORS = {
  // Primary Colors - CREAM/BEIGE LUXURY THEME
  PRIMARY_DARK: '#F5E6D3', // Cream/Beige background - MAIN BACKGROUND COLOR
  PRIMARY_MEDIUM: '#FFFFFF', // White for input fields
  PRIMARY_LIGHT: '#333333', // Dark text for contrast on cream background
  
  // Accent Colors - LUXURY GOLD
  ACCENT_GOLD: '#B8860B', // Luxury Gold - primary accent color
  ACCENT_TURQUOISE: '#40E0D0',
  ACCENT_RED: '#F44336',
  
  // Neutral Colors
  NEUTRAL_LIGHT: '#A9A9A9', // Placeholder text
  NEUTRAL_MEDIUM: '#5A6A80',
  
  // Additional Colors
  ACCENT_GOLD_TRANSPARENT: 'rgba(184, 134, 11, 0.2)',
  ACCENT_GREEN: '#5CB85C',
  OVERLAY_DARK: 'rgba(0, 0, 0, 0.7)',
  BIOMETRIC_BUTTON: '#00008B', // Dark blue for biometric button
  
  // Keep original dark colors for reference/future use if needed
  ORIGINAL_DARK: '#0A1931',
  ORIGINAL_MEDIUM: '#1A2E4B',
};

// --- TYPOGRAPHY ---
export const TYPOGRAPHY = {
  FONT_FAMILY_SERIF: 'Alegreya-Bold',
  FONT_FAMILY_SANS: 'Inter-Regular',

  SIZE_H1: 32,
  SIZE_H2: 24,
  SIZE_H3: 20,
  SIZE_H4: 18,
  SIZE_H5: 16,
  SIZE_BODY: 16,
  SIZE_SMALL: 12,

  // fontWeight as proper TextStyle['fontWeight']
  WEIGHT_BOLD: '700' as TextStyle['fontWeight'],
  WEIGHT_MEDIUM: '500' as TextStyle['fontWeight'],
  WEIGHT_NORMAL: '400' as TextStyle['fontWeight'],
};

// --- SPACING ---
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

// --- BORDER RADIUS ---
export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 16,
  CIRCLE: 999,
};

// --- COMPONENT STYLES ---
export const COMPONENTS = {
  BUTTON_PRIMARY: {
    backgroundColor: COLORS.ACCENT_GOLD,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    text: {
      color: '#FFFFFF',
      fontSize: TYPOGRAPHY.SIZE_BODY,
      fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_SANS,
      textAlign: 'center' as TextStyle['textAlign'],
    },
  },
  BUTTON_SECONDARY: {
    backgroundColor: 'transparent',
    borderColor: COLORS.ACCENT_GOLD,
    borderWidth: 1,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    text: {
      color: COLORS.ACCENT_GOLD,
      fontSize: TYPOGRAPHY.SIZE_BODY,
      fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_SANS,
      textAlign: 'center' as TextStyle['textAlign'],
    },
  },
  INPUT_FIELD: {
    backgroundColor: COLORS.PRIMARY_MEDIUM,
    color: COLORS.PRIMARY_LIGHT,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.ACCENT_GOLD,
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SANS,
    fontWeight: TYPOGRAPHY.WEIGHT_NORMAL,
  },
  CARD: {
    backgroundColor: COLORS.PRIMARY_MEDIUM,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    shadowColor: COLORS.ACCENT_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
};

// --- GLOBAL STYLES ---
export const GLOBAL_STYLES = StyleSheet.create({
  SCREEN_CONTAINER: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_DARK, // Cream/Beige background
    padding: SPACING.MD,
  },
  TEXT_H1: {
    fontSize: TYPOGRAPHY.SIZE_H1,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.ACCENT_GOLD,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SERIF,
  },
  TEXT_BODY: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: COLORS.PRIMARY_LIGHT,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SANS,
    fontWeight: TYPOGRAPHY.WEIGHT_NORMAL,
  },
  TEXT_ACCENT: {
    color: COLORS.ACCENT_GOLD,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SANS,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  BUTTON_TEXT_PRIMARY: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SANS,
  },
  BUTTON_TEXT_SECONDARY: {
    color: COLORS.ACCENT_GOLD,
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SANS,
  },
});
// styles/LanguageSelectionScreen.styles.ts
import { StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS, BORDER_RADIUS } from './theme';

export const LanguageSelectionScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_DARK,
    padding: SPACING.LG,
  },
  header: {
    marginBottom: SPACING.XXL,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_H1,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SERIF,
    color: COLORS.PRIMARY_LIGHT,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SANS,
    color: COLORS.NEUTRAL_LIGHT,
    textAlign: 'center',
    marginBottom: SPACING.XL,
  },
  languageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  languageButton: {
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 14,
    marginVertical: 12,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  languageText: {
    fontSize: TYPOGRAPHY.SIZE_H3,
    fontWeight: '700',
  },
  languageTextArabic: {
    fontSize: TYPOGRAPHY.SIZE_H3,
    fontWeight: '700',
    fontFamily: 'Arial',
  },
  backgroundImage: {
    position: 'absolute',
    resizeMode: 'cover',
    opacity: 0.12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});

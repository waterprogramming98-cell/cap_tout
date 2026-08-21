import { StyleSheet, Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS, BORDER_RADIUS } from './theme';

export const CaptainReviewsScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_DARK,
    padding: SPACING.MD,
  },
  header: {
    marginBottom: SPACING.LG,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_H1,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SERIF,
    color: COLORS.ACCENT_GOLD,
    textAlign: 'center',
  },
  // Overall Rating Summary
  summaryCard: {
    ...COMPONENTS.CARD,
    marginBottom: SPACING.XL,
    padding: SPACING.LG,
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 64,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SERIF,
    color: COLORS.ACCENT_TURQUOISE,
    fontWeight: '700', // replaced to avoid missing constant
  },
  starRatingContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  starIcon: {
    fontSize: 24,
    color: COLORS.ACCENT_GOLD,
    marginHorizontal: SPACING.XS,
  },
  reviewCount: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: COLORS.NEUTRAL_LIGHT,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SANS,
  },
  // Individual Reviews List
  reviewList: {
    flexGrow: 1,
    paddingBottom: SPACING.XL,
  },
  reviewCard: {
    ...COMPONENTS.CARD,
    marginBottom: SPACING.MD,
    padding: SPACING.MD,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  reviewerName: {
    fontSize: TYPOGRAPHY.SIZE_H3,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SANS,
    color: COLORS.PRIMARY_LIGHT,
  },
  reviewDate: {
    fontSize: TYPOGRAPHY.SIZE_SMALL,
    color: COLORS.NEUTRAL_MEDIUM,
  },
  reviewText: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: COLORS.NEUTRAL_LIGHT,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SANS,
    marginTop: SPACING.SM,
  },
});

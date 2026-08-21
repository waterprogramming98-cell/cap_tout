import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS, BORDER_RADIUS } from './theme';

const { width } = Dimensions.get('window');

export const CaptainDashboardScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_DARK,
  },

  /* ================= LOGO BACKGROUND ================= */
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.1,
  },

  logoImage: {
    width: width * 0.6,
    height: width * 0.6,
    resizeMode: 'contain',
  },

  /* ================= SCROLL ================= */
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 80,
  },

  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XXL,
  },

  /* ================= TITLE ================= */
  title: {
    fontSize: TYPOGRAPHY.SIZE_H2,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SERIF,
    fontWeight: '700',
    color: COLORS.ACCENT_GOLD,
    marginBottom: SPACING.LG,
  },

  /* ================= STATUS ================= */
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: SPACING.MD,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.LG,
  },

  statusLabel: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: '700',
    color: COLORS.ACCENT_GOLD,
  },

  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusText: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: '700',
    marginRight: SPACING.SM,
    color: COLORS.ACCENT_GOLD,
  },

  offlineText: {
    color: COLORS.NEUTRAL_LIGHT,
  },

  /* ================= BOOKINGS ================= */
  bookingsContainer: {
    width: '100%',
    marginTop: SPACING.MD,
  },

  bookingsTitle: {
    fontSize: TYPOGRAPHY.SIZE_H3,
    fontWeight: '700',
    color: COLORS.ACCENT_GOLD,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },

  bookingCard: {
    backgroundColor: COLORS.NEUTRAL_LIGHT,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.ACCENT_GOLD,
  },

  bookingHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: SPACING.SM,
    marginBottom: SPACING.SM,
  },

  passengerName: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
  },

  bookingDetails: {
    marginBottom: SPACING.SM,
  },

  routeText: {
    fontSize: TYPOGRAPHY.SIZE_SMALL,
    color: '#555',
  },

  priceContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.SM,
  },

  price: {
    fontSize: TYPOGRAPHY.SIZE_H3,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
  },

  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  rejectButton: {
    flex: 1,
    backgroundColor: '#d9534f',
    padding: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
    alignItems: 'center',
    marginRight: SPACING.XS,
  },

  rejectButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  acceptButton: {
    flex: 1,
    backgroundColor: '#5cb85c',
    padding: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
    alignItems: 'center',
    marginLeft: SPACING.XS,
  },

  acceptButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  offlineMessage: {
    padding: SPACING.MD,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: BORDER_RADIUS.MD,
    marginTop: SPACING.LG,
  },

  offlineMessageText: {
    color: COLORS.ACCENT_GOLD,
    textAlign: 'center',
  },

  /* ================= ACTION BUTTONS ================= */
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: SPACING.LG,
  },

  actionButton: {
    flex: 1,
    backgroundColor: COLORS.ACCENT_GOLD,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    marginHorizontal: SPACING.XS,
  },

  actionButtonText: {
    color: COLORS.PRIMARY_DARK,
    fontWeight: '700',
  },

  logoutButton: {
    backgroundColor: '#d9534f',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.XXL,
  },

  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

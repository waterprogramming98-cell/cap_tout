import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const welcomeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagesContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.5,
    height: undefined,
    aspectRatio: 1,
    marginBottom: 10,
  },
  pharaohHead: {
    width: width * 0.4,
    height: undefined,
    aspectRatio: 1,
    marginBottom: 10,
  },
  chariot: {
    width: width * 0.6,
    height: undefined,
    aspectRatio: 2,
    marginBottom: 20,
  },
  text: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});

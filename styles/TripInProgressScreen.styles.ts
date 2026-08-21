import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
export const tripInProgressScreenStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    map: {
        flex: 1,
    },
    statusContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.9)',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        zIndex: 10,
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    actionButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#8B4513',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        zIndex: 10,
    },
    completeButton: {
        backgroundColor: '#4CAF50', // Green for completion
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    infoBox: {
        position: 'absolute',
        bottom: 120,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 15,
        borderRadius: 10,
        zIndex: 10,
    },
    infoText: {
        color: '#FFD700',
        fontSize: 16,
        marginBottom: 5,
    },
    // Styles for the captain marker icon
    captainMarker: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
});
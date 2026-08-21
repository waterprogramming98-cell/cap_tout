// utils/firebaseConfig.ts
// Uses @react-native-firebase which auto-initializes from google-services.json
// Do NOT call initializeApp() - the native SDK handles initialization automatically
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Export service instances - these are already initialized from google-services.json
export { auth, firestore as db, storage };

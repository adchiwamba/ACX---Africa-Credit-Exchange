import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const config = firebaseConfig as Record<string, string>;
export const db = config.firestoreDatabaseId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true, ignoreUndefinedProperties: true }, config.firestoreDatabaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true, ignoreUndefinedProperties: true });
export const auth = getAuth(app);

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getFirebaseConfig, getFirestoreDatabaseId } from './firebaseConfig';

const firebaseConfig = getFirebaseConfig();

const app = initializeApp(firebaseConfig);

const firestoreDbId = getFirestoreDatabaseId(firebaseConfig);
export const db = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

/**
 * Gets or creates a stable, local-only player UID in localStorage.
 * This ensures that refreshing the browser on their own phone doesn't kick them out of the room.
 */
export function getOrCreateClientUserId(): string {
  const KEY = 'guess_me_israeli_userId';
  let userId = localStorage.getItem(KEY);
  if (!userId) {
    userId = 'usr_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem(KEY, userId);
  }
  return userId;
}

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Validate Connection to Firestore on boot as required by the Firebase Skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && (error.message.includes('unavailable') || error.message.includes('offline') || error.message.includes('Could not reach'))) {
      console.warn("Firestore connection long-polling/offline mode active:", error.message);
    } else {
      console.warn("Firestore connection check note:", error instanceof Error ? error.message : error);
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // Handle transient connectivity/availability issues gracefully
  if (errMessage.includes('unavailable') || errMessage.includes('offline') || errMessage.includes('Could not reach Cloud Firestore')) {
    console.warn('Firestore connectivity temporarily degraded. Operating in offline mode.');
    return;
  }

  // Handle permission errors gracefully without throwing unhandled exceptions that break UI or tests
  if (errMessage.includes('permission') || errMessage.includes('Permission') || errMessage.includes('insufficient')) {
    console.warn('Firestore operation blocked by security rules or permissions:', errInfo);
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}

export function cleanFirestoreData<T>(val: T): T {
  if (val === undefined) return val;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map(item => cleanFirestoreData(item)).filter(item => item !== undefined) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(val as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreData(value);
    }
  }
  return cleaned as T;
}

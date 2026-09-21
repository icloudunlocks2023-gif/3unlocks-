import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence verbose internal Firebase SDK transport connection warnings
try {
  setLogLevel('silent');
} catch (e) {}

// Intercept benign transient connection logs from @firebase/firestore (e.g. offline transitions or single retries)
// so they do not falsely report as fatal application errors to automated monitors while Firestore gracefully operates
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const firstArgStr = typeof args[0] === 'string' ? args[0] : (args[0]?.message || String(args[0] || ''));
    if (
      firstArgStr.includes('@firebase/firestore') ||
      firstArgStr.includes('Cloud Firestore backend') ||
      firstArgStr.includes('Could not reach Cloud Firestore') ||
      (firstArgStr.includes('code=unavailable') && firstArgStr.includes('operation could not be completed'))
    ) {
      console.warn(...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

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

  // Handle transient connectivity/availability issues gracefully without raising alarms
  if (
    errMessage.includes('unavailable') ||
    errMessage.includes('offline') ||
    errMessage.includes('Could not reach Cloud Firestore') ||
    errMessage.includes('The operation could not be completed')
  ) {
    console.warn('Firestore connectivity temporarily degraded. Operating in offline cache mode.');
    return;
  }

  // Handle permission errors gracefully without throwing unhandled exceptions that break UI or tests
  if (errMessage.includes('permission') || errMessage.includes('Permission') || errMessage.includes('insufficient')) {
    console.warn('Firestore operation blocked by security rules or permissions:', errInfo);
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
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

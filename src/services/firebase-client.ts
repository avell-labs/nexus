import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID as
    | string
    | undefined,
  appId: import.meta.env.FIREBASE_APP_ID as string | undefined,
};

let cachedApp: FirebaseApp | null = null;
let configWarningLogged = false;

function hasFirebaseConfig(): boolean {
  return Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

export function getFirebaseApp(): FirebaseApp | null {
  if (cachedApp) {
    return cachedApp;
  }

  if (!hasFirebaseConfig()) {
    if (!configWarningLogged) {
      console.warn(
        "Firebase config is missing. Set FIREBASE_* values in .env to enable remote data.",
      );
      configWarningLogged = true;
    }
    return null;
  }

  if (getApps().length === 0) {
    cachedApp = initializeApp(firebaseConfig);
  } else {
    cachedApp = getApp();
  }

  return cachedApp;
}

export function getFirestoreDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  return getFirestore(app);
}

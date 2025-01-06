import { db, auth } from "../firebase";
import {
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

export const SESSION_COLLECTION = "sessions";

export const createSession = async (userId) => {
  // First, clean up any existing sessions for this user
  await clearAllUserSessions(userId);

  // Create new session
  const sessionRef = doc(db, SESSION_COLLECTION, userId);
  const sessionData = {
    userId,
    deviceInfo: window.navigator.userAgent,
    lastActive: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  await setDoc(sessionRef, sessionData);
  return userId; // Using userId as sessionId for simplicity
};

export const checkExistingSessions = async (userId) => {
  const sessionsRef = collection(db, SESSION_COLLECTION);
  const q = query(sessionsRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    // Found existing session(s)
    const existingSession = snapshot.docs[0].data();

    // If session exists and it's not from current device
    if (existingSession.deviceInfo !== window.navigator.userAgent) {
      // Force logout existing sessions
      await clearAllUserSessions(userId);
      return true;
    }
  }
  return false;
};

export const clearAllUserSessions = async (userId) => {
  const sessionsRef = collection(db, SESSION_COLLECTION);
  const q = query(sessionsRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);

  const deletionPromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));

  await Promise.all(deletionPromises);
};

export const validateCurrentSession = async (userId) => {
  const sessionRef = doc(db, SESSION_COLLECTION, userId);
  const sessionDoc = await getDoc(sessionRef);

  if (!sessionDoc.exists()) {
    // Session doesn't exist, force logout
    await signOut(auth);
    return false;
  }

  const sessionData = sessionDoc.data();
  if (sessionData.deviceInfo !== window.navigator.userAgent) {
    // Session exists but from different device
    await signOut(auth);
    return false;
  }

  return true;
};

export const clearSession = async (userId) => {
  await clearAllUserSessions(userId);
};

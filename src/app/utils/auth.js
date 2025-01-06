import { getAuth, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  createSession,
  checkExistingSessions,
  validateCurrentSession,
} from "./sessionManager";

export const loginWithSession = async (email, password) => {
  const auth = getAuth();

  // First perform regular Firebase authentication
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  try {
    // After successful auth, check for existing sessions
    const hasExistingSession = await checkExistingSessions(user.uid);
    if (hasExistingSession) {
      // If there's an existing session, we'll still create new session
      // but return a specific status to notify the user
      await createSession(user.uid);
      return {
        success: true,
        status: "existing_session_terminated",
        message: "Previous session was terminated",
      };
    }

    // Create new session for fresh login
    await createSession(user.uid);
    return {
      success: true,
      status: "new_session",
      message: "Login successful",
    };
  } catch (error) {
    // If session management fails, still keep user logged in
    console.error("Session management error:", error);
    return {
      success: true,
      status: "session_error",
      message: "Logged in but session management failed",
    };
  }
};

export const isAuthenticated = async (requiredRole) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return false;
  }

  try {
    // Validate current session
    const isSessionValid = await validateCurrentSession(user.uid);
    if (!isSessionValid) {
      await signOut(auth);
      return false;
    }

    if (!requiredRole) {
      return true;
    }

    const userCollectionRef = collection(db, "user");
    const userQuery = query(
      userCollectionRef,
      where("email", "==", user.email)
    );
    const userQuerySnapshot = await getDocs(userQuery);

    if (!userQuerySnapshot.empty) {
      const userDoc = userQuerySnapshot.docs[0];
      const userData = userDoc.data();
      return userData.role === requiredRole;
    }
  } catch (error) {
    console.error("Authentication check error:", error);
    return false;
  }

  return false;
};

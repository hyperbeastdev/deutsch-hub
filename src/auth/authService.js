import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase.js";
import { normalizeAuthError } from "./authErrors.js";

export function createAuthService(overrides = {}) {
  const firebaseAuth = overrides.auth || auth;
  const provider = overrides.googleProvider || googleProvider;
  const signInWithPopupImpl = overrides.signInWithPopup || signInWithPopup;
  const signOutImpl = overrides.signOut || signOut;
  const onAuthStateChangedImpl = overrides.onAuthStateChanged || onAuthStateChanged;
  let signInPromise = null;
  let activeSignIn = null;
  let signOutPromise = null;

  return {
    signInWithGoogle() {
      if (signInPromise) return signInPromise;

      let rejectCancellation;
      const cancellation = new Promise((_, reject) => {
        rejectCancellation = reject;
      });
      const firebaseRequest = (async () => {
        try {
          return await signInWithPopupImpl(firebaseAuth, provider);
        } catch (error) {
          throw normalizeAuthError(error);
        }
      })();
      const request = Promise.race([firebaseRequest, cancellation]);
      signInPromise = request;
      activeSignIn = {
        request,
        cancel() {
          rejectCancellation(normalizeAuthError({ code: "auth/popup-closed-by-user" }));
        },
      };

      const clearRequest = () => {
        if (signInPromise === request) signInPromise = null;
        if (activeSignIn?.request === request) activeSignIn = null;
      };
      request.then(clearRequest, clearRequest);

      return request;
    },

    cancelGoogleSignIn() {
      if (!activeSignIn) return false;
      activeSignIn.cancel();
      return true;
    },

    async signOutUser() {
      if (signOutPromise) return signOutPromise;

      signOutPromise = (async () => {
        try {
          return await signOutImpl(firebaseAuth);
        } catch (error) {
          throw normalizeAuthError(error);
        }
      })();

      try {
        return await signOutPromise;
      } finally {
        signOutPromise = null;
      }
    },

    subscribeToAuthState(onUser, onError) {
      return onAuthStateChangedImpl(
        firebaseAuth,
        onUser,
        error => onError?.(normalizeAuthError(error)),
      );
    },

    getCurrentUser() {
      return firebaseAuth.currentUser || null;
    },
  };
}

export const authService = createAuthService();

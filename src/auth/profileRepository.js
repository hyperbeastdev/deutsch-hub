import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export const PROFILE_STATES = Object.freeze({
  FOUND: "found",
  NOT_FOUND: "not_found",
  READ_ERROR: "read_error",
});

export async function readUserProfile(uid, dependencies = {}) {
  const dbInstance = dependencies.db || db;
  const docFactory = dependencies.doc || doc;
  const getDocImpl = dependencies.getDoc || getDoc;

  try {
    const snapshot = await getDocImpl(docFactory(dbInstance, "users", uid));
    if (!snapshot.exists()) return { status: PROFILE_STATES.NOT_FOUND, data: null };
    return { status: PROFILE_STATES.FOUND, data: snapshot.data() };
  } catch (error) {
    return { status: PROFILE_STATES.READ_ERROR, data: null, error };
  }
}

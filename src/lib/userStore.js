import { create } from 'zustand';
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * User store state management using zustand.
 * @returns {object} Zustand store with user state and fetch function.
 */
export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,

  /**
   * Fetch user information based on UID.
   * @param {string} uid - User ID to fetch the information.
   */
  fetchUserInfo: async (uid) => {
    if (!uid) {
      return set({ currentUser: null, isLoading: false });
    }

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        set({ currentUser: docSnap.data(), isLoading: false, lastSeen: docSnap.data().lastSeen});
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      console.error("Error fetching user information:", err);
      return set({ currentUser: null, isLoading: false });
    }
  },
}));

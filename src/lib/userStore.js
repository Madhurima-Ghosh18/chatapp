import { create } from 'zustand';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const useUserStore = create((set, get) => ({
  currentUser: null,
  isLoading: true,
  theme: localStorage.getItem('theme') || 'dark-theme', // Default to dark theme

  fetchUserInfo: async (uid) => {
    if (!uid) {
      return set({ currentUser: null, isLoading: false });
    }

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const user = { ...docSnap.data(), uid };
        set({ currentUser: user, isLoading: false, theme: user.theme || 'dark-theme' });
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      console.error("Error fetching user information:", err);
      set({ currentUser: null, isLoading: false });
    }
  },

  updateUser: async (updatedUserData) => {
    const currentUser = get().currentUser;

    if (!currentUser || !currentUser.uid) {
      console.error("No current user found at the time of update");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, updatedUserData);

      set((state) => ({
        currentUser: { ...state.currentUser, ...updatedUserData }
      }));

      // Update theme in local storage if it's changed
      if (updatedUserData.theme) {
        localStorage.setItem('theme', updatedUserData.theme);
      }
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  },

  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
    if (get().currentUser) {
      get().updateUser({ theme });
    }
  },
}));

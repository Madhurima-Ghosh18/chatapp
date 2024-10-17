import { create } from 'zustand';
import { doc, updateDoc, arrayRemove, arrayUnion, deleteField } from "firebase/firestore";
import { db } from "./firebase";
import { useUserStore } from './userStore';

export const useChatStore = create((set, get) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
  scrollToMessageTimestamp: null,
  isChatSelected: false,
  messages: [],
  changeChat: (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;
    if (user.blocked.includes(currentUser.id)) {
      return set({
        chatId,
        user: user,
        isCurrentUserBlocked: true,
        isReceiverBlocked: false,
        isChatSelected: true,
      });
    } else if (currentUser.blocked.includes(user.id)) {
      return set({
        chatId,
        user: user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: true,
        isChatSelected: true,
      });
    } else {
      return set({
        chatId,
        user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
        isChatSelected: true,
      });
    }
  },
  clearSelectedChat: () => set({ chatId: null, user: null, isChatSelected: false }),
  changeBlock: () => {
    set((state) => ({ ...state, isReceiverBlocked: !state.isReceiverBlocked }));
  },
  setScrollToMessageTimestamp: (timestamp) => set({ scrollToMessageTimestamp: timestamp }),
  setMessages: (messages) => set({ messages }),
  clearChatMessages: async () => {
    const { chatId } = get(); // Correctly get the state here
    if (!chatId) return;

    try {
      const chatDocRef = doc(db, "chats", chatId);
      await updateDoc(chatDocRef, {
        messages: deleteField(),
      });
      set({ messages: [] }); // Clear local messages state
    } catch (error) {
      console.error("Error clearing chat messages:", error);
    }
  },
}));

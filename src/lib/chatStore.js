import { create } from 'zustand';
import { doc, updateDoc, arrayRemove, arrayUnion, deleteField, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
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
    const { chatId } = get();
    if (!chatId) return;

    try {
      const chatDocRef = doc(db, "chats", chatId);
      await updateDoc(chatDocRef, {
        messages: deleteField(),
      });
      set({ messages: [] });
    } catch (error) {
      console.error("Error clearing chat messages:", error);
    }
  },

  createChat: async (currentUser, selectedUser) => {
    const combinedId =
      currentUser.id > selectedUser.id
        ? currentUser.id + selectedUser.id
        : selectedUser.id + currentUser.id;

    try {
      const chatDoc = await getDoc(doc(db, "chats", combinedId));

      if (!chatDoc.exists()) {
        // Create chat document
        await setDoc(doc(db, "chats", combinedId), {
          messages: []
        });
      }

      const chatData = {
        chatId: combinedId,
        receiverId: selectedUser.id,
        createdAt: serverTimestamp()
      };

      // Update userchats for current user
      const currentUserChatsRef = doc(db, "userchats", currentUser.id);
      await updateDoc(currentUserChatsRef, {
        chats: arrayRemove(chatData)
      });
      await updateDoc(currentUserChatsRef, {
        chats: arrayUnion({
          ...chatData,
          createdAt: serverTimestamp() // Update timestamp
        })
      });

      // Update userchats for selected user
      const selectedUserChatsRef = doc(db, "userchats", selectedUser.id);
      await updateDoc(selectedUserChatsRef, {
        chats: arrayRemove({...chatData, receiverId: currentUser.id})
      });
      await updateDoc(selectedUserChatsRef, {
        chats: arrayUnion({
          ...chatData,
          receiverId: currentUser.id,
          createdAt: serverTimestamp() // Update timestamp
        })
      });

      // Select the new or existing chat
      get().changeChat(combinedId, selectedUser);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  }
}));
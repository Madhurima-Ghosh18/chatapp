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
  userBlockStatus: null,

  determineBlockStatus: (currentUser, otherUser) => {
    const isBlockedByReceiver = otherUser.blocked?.includes(currentUser.id) || false;
    const hasBlockedReceiver = currentUser.blocked?.includes(otherUser.id) || false;
    
    return {
      isCurrentUserBlocked: isBlockedByReceiver,
      isReceiverBlocked: hasBlockedReceiver,
      shouldHideAvatar: isBlockedByReceiver && !hasBlockedReceiver,
      shouldShowDefaultAvatar: isBlockedByReceiver
    };
  },

  changeChat: (chatId, user) => {
    // Only proceed if there's both a chatId and user
    if (!chatId || !user) {
      return set({
        chatId: null,
        user: null,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
        userBlockStatus: null,
        isChatSelected: false,
      });
    }

    const currentUser = useUserStore.getState().currentUser;
    const blockStatus = get().determineBlockStatus(currentUser, user);

    set({
      chatId,
      user: {
        ...user,
        avatar: blockStatus.shouldHideAvatar ? "./avatar.png" : user.avatar
      },
      isCurrentUserBlocked: blockStatus.isCurrentUserBlocked,
      isReceiverBlocked: blockStatus.isReceiverBlocked,
      userBlockStatus: blockStatus,
      isChatSelected: true,
    });
  },

  clearSelectedChat: () => set({ 
    chatId: null, 
    user: null, 
    isChatSelected: false,
    userBlockStatus: null,
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,
  }),

  changeBlock: async () => {
    const state = get();
    const currentUser = useUserStore.getState().currentUser;
    
    if (!state.user) return;

    const newBlockStatus = !state.isReceiverBlocked;
    
    try {
      const userRef = doc(db, "users", currentUser.id);
      if (newBlockStatus) {
        await updateDoc(userRef, {
          blocked: arrayUnion(state.user.id)
        });
      } else {
        await updateDoc(userRef, {
          blocked: arrayRemove(state.user.id)
        });
      }

      const updatedBlockStatus = get().determineBlockStatus(
        { ...currentUser, blocked: newBlockStatus ? [...(currentUser.blocked || []), state.user.id] : currentUser.blocked?.filter(id => id !== state.user.id) },
        state.user
      );

      set({
        isReceiverBlocked: newBlockStatus,
        userBlockStatus: updatedBlockStatus,
        user: {
          ...state.user,
          avatar: updatedBlockStatus.shouldHideAvatar ? "./avatar.png" : state.user.avatar
        }
      });
    } catch (error) {
      console.error("Error updating block status:", error);
    }
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
        await setDoc(doc(db, "chats", combinedId), {
          messages: []
        });
      }

      const chatData = {
        chatId: combinedId,
        receiverId: selectedUser.id,
        createdAt: serverTimestamp()
      };

      // Update userchats for both users
      const updateUserChats = async (userRef, receiverId) => {
        await updateDoc(userRef, {
          chats: arrayRemove({ ...chatData, receiverId })
        });
        await updateDoc(userRef, {
          chats: arrayUnion({
            ...chatData,
            receiverId,
            createdAt: serverTimestamp()
          })
        });
      };

      await Promise.all([
        updateUserChats(doc(db, "userchats", currentUser.id), selectedUser.id),
        updateUserChats(doc(db, "userchats", selectedUser.id), currentUser.id)
      ]);

      // Only change chat if both chatId and selectedUser are valid
      if (combinedId && selectedUser) {
        const blockStatus = get().determineBlockStatus(currentUser, selectedUser);
        get().changeChat(combinedId, {
          ...selectedUser,
          avatar: blockStatus.shouldHideAvatar ? "./avatar.png" : selectedUser.avatar
        });
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  }
}));
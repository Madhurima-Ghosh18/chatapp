import { useEffect, useState } from "react";
import "../../../theme.css";
import "./chatList.css";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc, collection } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
import { useTheme } from "../../../ThemeContext";

const ChatList = () => {
  const { theme } = useTheme();
  const [addMode, setAddMode] = useState(false);
  const [chats, setChats] = useState([]);
  const { currentUser } = useUserStore();
  const { chatId, changeChat, determineBlockStatus } = useChatStore();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    const unSubUserChats = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
      const items = res.data()?.chats || [];
      const promises = items.map(async (item) => {
        try {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);
          const userData = {
            ...userDocSnap.data(),
            id: item.receiverId
          };

          // Use the centralized blocking logic
          const blockStatus = determineBlockStatus(currentUser, userData);
          const user = {
            ...userData,
            // Apply avatar logic based on block status
            avatar: blockStatus.shouldHideAvatar ? "./avatar.png" : userData.avatar
          };

          const chatDocRef = doc(db, "chats", item.chatId);
          const chatDocSnap = await getDoc(chatDocRef);
          const chatData = chatDocSnap.data();
          const lastMessage = chatData?.messages
            ?.filter(msg => !msg.deletedFor?.includes(currentUser.id))
            ?.slice(-1)[0] || null;

          return {
            ...item,
            user,
            lastMessage,
            blockStatus // Store block status for reference
          };
        } catch (error) {
          console.error("Error fetching chat data:", error);
          return null;
        }
      });

      const chatData = await Promise.all(promises);
      setChats(chatData.filter(chat => chat !== null));
    });

    return () => {
      unSubUserChats();
    };
  }, [currentUser.id, determineBlockStatus]);

  const handleSelect = async (chat) => {
    const updatedChats = chats.map(item =>
      item.chatId === chat.chatId ? { ...item, isSeen: true } : item
    );
    setChats(updatedChats);

    const userChatsRef = doc(db, "userchats", currentUser.id);
    try {
      await updateDoc(userChatsRef, {
        chats: updatedChats.map(({ user, lastMessage, blockStatus, ...rest }) => rest)
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.error("Error updating chat:", err);
    }
  };

  const getLastMessagePreview = (lastMessage) => {
    if (!lastMessage) return "";
    if (lastMessage.img) return "Image";
    if (lastMessage.doc) {
      const docExtension = lastMessage.docName.split('.').pop();
      return `Document (${docExtension.toUpperCase()})`;
    }
    return lastMessage.text || "";
  };

  // Remove getAvatarUrl function since avatar handling is now done during chat data processing

  const sortedChats = chats
    .filter(c => c.user.username.toLowerCase().includes(input.toLowerCase()))
    .sort((a, b) => {
      const aCreatedTime = a.createdAt?.toMillis() || 0;
      const bCreatedTime = b.createdAt?.toMillis() || 0;
      
      const aLastMessageTime = a.lastMessage?.createdAt?.toMillis() || 0;
      const bLastMessageTime = b.lastMessage?.createdAt?.toMillis() || 0;
      
      if (aCreatedTime !== bCreatedTime) {
        return bCreatedTime - aCreatedTime;
      }
      
      return bLastMessageTime - aLastMessageTime;
    });

  return (
    <div className={`ChatList ${theme}`}>
      <div className="chatList">
        <div className="search">
          <div className="searchBar">
            <img src="./search.png" alt="search icon" />
            <input
              type="text"
              placeholder="Search"
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <img
            src={addMode ? "./minus.png" : "./plus.png"}
            alt="toggle add user"
            className="add"
            onClick={() => setAddMode((prev) => !prev)}
          />
        </div>
        {sortedChats.map(chat => (
          <div
            className={`item ${!chat.isSeen ? "unseen" : ""}`}
            key={chat.chatId}
            onClick={() => handleSelect(chat)}
          >
            <img
              src={chat.user.avatar || "./avatar.png"}
              alt="user avatar"
            />
            <div className="texts">
              <span>{chat.user.username}</span>
              <p>{getLastMessagePreview(chat.lastMessage)}</p>
            </div>
          </div>
        ))}
        {addMode && <AddUser />}
      </div>
    </div>
  );
};

export default ChatList;
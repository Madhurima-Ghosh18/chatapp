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
  const { chatId, changeChat, clearSelectedChat } = useChatStore();
  const [input, setInput] = useState("");

  useEffect(() => {
    const unSubUserChats = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
      const items = res.data()?.chats || [];
      const promises = items.map(async (item) => {
        try {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);
          const user = userDocSnap.data();

          const chatDocRef = doc(db, "chats", item.chatId);
          const chatDocSnap = await getDoc(chatDocRef);
          const chatData = chatDocSnap.data();
          const lastMessage = chatData?.messages
            ?.filter(msg => !msg.deletedFor?.includes(currentUser.id))
            ?.slice(-1)[0] || null;

          return { ...item, user, lastMessage };
        } catch (error) {
          console.error("Error fetching chat data:", error);
          return null;
        }
      });

      const chatData = await Promise.all(promises);
      setChats(chatData.filter(chat => chat !== null));
    });

    const unSubChats = onSnapshot(collection(db, "chats"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const chatData = change.doc.data();
          const lastMessage = chatData.messages
            .filter(msg => !msg.deletedFor?.includes(currentUser.id))
            .slice(-1)[0];

          setChats((prevChats) => {
            return prevChats.map((chat) => {
              if (chat.chatId === change.doc.id) {
                const isSeen = lastMessage && lastMessage.senderId === currentUser.id || chat.isSeen;
                return { ...chat, lastMessage, isSeen };
              }
              return chat;
            });
          });
        }
      });
    });

    return () => {
      unSubUserChats();
      unSubChats();
    };
  }, [currentUser.id, clearSelectedChat, changeChat]);

  useEffect(() => {
    clearSelectedChat();
  }, [clearSelectedChat]);

  const handleSelect = async (chat) => {
    const updatedChats = chats.map(item =>
      item.chatId === chat.chatId ? { ...item, isSeen: true } : item
    );
    setChats(updatedChats);

    const userChatsRef = doc(db, "userchats", currentUser.id);
    try {
      await updateDoc(userChatsRef, {
        chats: updatedChats.map(({ user, lastMessage, ...rest }) => rest)
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

  const sortedChats = chats
    .filter(c => c.user.username.toLowerCase().includes(input.toLowerCase()))
    .sort((a, b) => {
      // First, sort by the creation time of the chat (for newly added users)
      const aCreatedTime = a.createdAt?.toMillis() || 0;
      const bCreatedTime = b.createdAt?.toMillis() || 0;
      
      // Then, sort by the last message time
      const aLastMessageTime = a.lastMessage?.createdAt?.toMillis() || 0;
      const bLastMessageTime = b.lastMessage?.createdAt?.toMillis() || 0;
      
      // If creation times are different, use them for sorting
      if (aCreatedTime !== bCreatedTime) {
        return bCreatedTime - aCreatedTime;
      }
      
      // If creation times are the same, use last message times
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
import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc, collection } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
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
          const lastMessage = chatData?.messages?.slice(-1)[0] || null;

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
          const lastMessage = chatData.messages[chatData.messages.length - 1];

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

  const filteredChats = chats
    .filter(c => c.user.username.toLowerCase().includes(input.toLowerCase()))
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.toMillis() || a.createdAt?.toMillis() || 0;
      const bTime = b.lastMessage?.createdAt?.toMillis() || b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });

  return (
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
      {filteredChats.map(chat => (
        <div
          className={`item ${!chat.isSeen ? "unseen" : ""}`}
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
        >
          <img
            src={chat.user.blocked.includes(currentUser.id)
              ? "./avatar.png"
              : chat.user.avatar || "./avatar.png"}
            alt="user avatar"
          />
          <div className="texts">
            <span>
              {chat.user.blocked.includes(currentUser.id)
                ? "User"
                : chat.user.username}
            </span>
            <p>{getLastMessagePreview(chat.lastMessage)}</p>
          </div>
        </div>
      ))}
      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;
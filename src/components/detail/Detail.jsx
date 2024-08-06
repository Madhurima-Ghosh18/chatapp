import { useState, useEffect } from "react";
import "./detail.css";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { doc, arrayRemove, arrayUnion, updateDoc, onSnapshot } from "firebase/firestore";

const Detail = () => {
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, setScrollToMessageTimestamp, setMessages } = useChatStore();
  const { currentUser } = useUserStore();
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    if (chatId) {
      const unsubscribe = onSnapshot(doc(db, "chats", chatId), (doc) => {
        const data = doc.data();
        if (data && data.messages) {
          const photos = data.messages
            .filter(message => message.img)
            .map(message => ({
              url: message.img,
              name: `photo_${new Date(message.createdAt.toDate()).toISOString()}.png`,
              timestamp: message.createdAt.toDate().getTime()
            }))
            .reverse()
            .slice(0, 5);
          setSharedPhotos(photos);
        }
      });

      return () => unsubscribe();
    }
  }, [chatId]);

  useEffect(() => {
    if (user && user.id && !isCurrentUserBlocked) {
      const userDocRef = doc(db, "users", user.id);
      const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setLastSeen(userData.lastSeen?.toDate());
        }
      });

      return () => unsubscribe();
    }
  }, [user, isCurrentUserBlocked]);

  const handleBlock = async () => {
    if (!user) return;
    const userDocRef = doc(db, "users", currentUser.id);
    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      console.log(err);
    }
  };

  const getBlockButtonText = () => {
    if (isCurrentUserBlocked) {
      return "Something is Wrong!";
    } else if (isReceiverBlocked) {
      return "Unblock User";
    } else {
      return "Block User";
    }
  };

  const isBlockButtonDisabled = () => {
    return isCurrentUserBlocked;
  };

  const togglePhotos = () => {
    setShowPhotos(prev => !prev);
  };

  const toggleOptions = () => {
    setShowOptions(prev => !prev);
  };

  const handleClearChat = async () => {
    if (!chatId) {
      console.error("Cannot clear chat: chatId is not defined");
      alert("Failed to clear chat: Chat ID is missing.");
      return;
    }

    try {
      const chatRef = doc(db, "chats", chatId);
      
      console.log("Updating document...");
      await updateDoc(chatRef, {
        messages: [],
      });

      console.log("Document updated successfully. Updating local state...");

      // Update local state
      setMessages([]);
      
      console.log("Local state updated. Closing options menu...");
      setShowOptions(false);
      
      console.log("Chat clear process completed successfully.");
 
    } catch (error) {
      console.error("Error in clear chat process:", error);
    }
  };

  const handlePhotoClick = (timestamp) => {
    setScrollToMessageTimestamp(timestamp);
  };

  const formatLastSeen = (date) => {
    if (isCurrentUserBlocked) {
      return "Last seen: Unknown";
    }
    if (isReceiverBlocked) {
      return "Last seen: Unavailable";
    }

    if (!date) return "Last seen: Unknown";


    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `Last seen: ${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `Last seen: ${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `Last seen: ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return "Last seen: Just now";
    }
  };

  // If there's no chat selected, render a placeholder
  if (!chatId || !user) {
    return (
      <div className="detail">
        <p>No chat selected</p>
      </div>
    );
  }

  return (
    <div className="detail">
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="" />
        <h2>{user?.username}</h2>
        <p>{formatLastSeen(lastSeen)}</p>
      </div>
      <div className="info">
        <div className="option">
          <div className="title" onClick={toggleOptions}>
            <span>Chat Settings</span>
            <img src={showOptions ? "./arrowUp.png" : "./arrowDown.png"} alt="" />
          </div>
          {showOptions && (
            <div className="options-menu">
              <button className="clearChat" onClick={handleClearChat}>Clear Chat</button>
            </div>
          )}
        </div>
        <div className="option">
          <div className="title" onClick={togglePhotos}>
            <span>Shared photos</span>
            <img src={showPhotos ? "./arrowUp.png" : "./arrowDown.png"} alt="" />
          </div>
          {showPhotos && (
            <div className="photos">
              {sharedPhotos.length > 0 ? (
                sharedPhotos.map((photo, index) => (
                  <div className="photoItem" key={index} onClick={() => handlePhotoClick(photo.timestamp)}>
                    <div className="photoDetail">
                      <img src={photo.url} alt="" />
                      <span>{photo.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="photoItem">
                  <div className="photoDetail empty">
                    <span>No photo</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <button 
          className="blockUser" 
          onClick={handleBlock} 
          disabled={isBlockButtonDisabled()}
        >
          {getBlockButtonText()}
        </button>
      </div>
    </div>
  );
};

export default Detail;
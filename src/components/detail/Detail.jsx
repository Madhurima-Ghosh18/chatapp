import { useState, useEffect } from "react";
import '../../theme.css';
import "./detail.css";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useTheme } from "../../ThemeContext";

const Detail = () => {
  const { theme } = useTheme();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, setScrollToMessageTimestamp, setMessages } = useChatStore();
  const { currentUser } = useUserStore();
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const { clearChatMessages } = useChatStore();

  let photocnt=1;
 

  useEffect(() => {
    if (chatId) {
      const unsubscribe = onSnapshot(doc(db, "chats", chatId), (doc) => {
        const data = doc.data();
        if (data && data.messages) {
          const photos = data.messages
            .filter(message => message.img)
            .map(message => ({
              url: message.img,
              name: `photo_${photocnt++}.png`,
              timestamp: message.createdAt.toDate().getTime()
            }))
            .reverse();

          const documents = data.messages
            .filter(message => message.doc)
            .map(message => ({
              url: message.doc,
              name: message.docName || `doc_${new Date(message.createdAt.toDate()).toISOString()}.pdf`,
              timestamp: message.createdAt.toDate().getTime()
            }))
            .reverse();

          setSharedPhotos(photos);
          setSharedDocuments(documents);
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

  const isBlockButtonDisabled = () => isCurrentUserBlocked;

  const togglePhotos = () => setShowPhotos(prev => !prev);
  const toggleDocuments = () => setShowDocuments(prev => !prev);
  const toggleOptions = () => setShowOptions(prev => !prev);

  const handleClearChat = async () => {
    try {
      await useChatStore.getState().clearChatMessages(); // Call clearChatMessages directly from the store
      setShowOptions(false);
    } catch (error) {
      console.error("Error in clear chat process:", error);
    }
  };
  

  const handlePhotoClick = (timestamp) => setScrollToMessageTimestamp(timestamp);
  const handleDocumentClick = (timestamp) => setScrollToMessageTimestamp(timestamp);

  const formatLastSeen = (date) => {
    if (isCurrentUserBlocked) return "Last seen: Unknown";
    if (isReceiverBlocked) return "Last seen: Unavailable";
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

  if (!chatId || !user) {
    return (
      <div className="detail">
        <p>No chat selected</p>
      </div>
    );
  }

  return (
    <div className={`Detail ${theme}`}>
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
            <span>Shared Photos</span>
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
                    <span>No photos</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="option">
          <div className="title" onClick={toggleDocuments}>
            <span>Shared Documents</span>
            <img src={showDocuments ? "./arrowUp.png" : "./arrowDown.png"} alt="" />
          </div>
          {showDocuments && (
            <div className="documents">
              {sharedDocuments.length > 0 ? (
                sharedDocuments.map((doc, index) => (
                  <div className="documentItem" key={index} onClick={() => handleDocumentClick(doc.timestamp)}>
                    <div className="documentDetail">
                      <span>{doc.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="documentItem">
                  <div className="documentDetail empty">
                    <span>No documents</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <button className="blockUser" onClick={handleBlock} disabled={isBlockButtonDisabled()}>
          {getBlockButtonText()}
        </button>
      </div>
    </div>
    </div>
  );
};

export default Detail;

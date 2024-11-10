import { useEffect, useState, useRef } from "react";
import '../../theme.css';
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { useTheme } from "../../ThemeContext";

const Chat = () => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [chat, setChat] = useState();
  const [img, setImg] = useState({ file: null, url: "" });
  const [docFile, setDocFile] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, scrollToMessageTimestamp, setScrollToMessageTimestamp } = useChatStore();
  const { currentUser } = useUserStore();
  const endRef = useRef(null);
  const messagesRef = useRef({});
  const [lastSeen, setLastSeen] = useState(null);
  const [deleteOptions, setDeleteOptions] = useState(null);

    useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });
    return () => {
      unSub();
    };
  }, [chatId]);

  useEffect(() => {
    if (scrollToMessageTimestamp && messagesRef.current[scrollToMessageTimestamp]) {
      messagesRef.current[scrollToMessageTimestamp].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setScrollToMessageTimestamp(null);
    }
  }, [scrollToMessageTimestamp, setScrollToMessageTimestamp]);

  useEffect(() => {
    if (user && user.id) {
      const userDocRef = doc(db, "users", user.id);
      const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setLastSeen(userData.lastSeen?.toDate());
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'];

    if (!acceptedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, SVG, GIF or WebP)');
      return;
    }

    try {
      const imageUrl = URL.createObjectURL(file);
      setImg({ file: file, url: imageUrl });
    } catch (error) {
      console.error('Error processing image:', error);
      alert('An error occurred while processing the image. Please try again.');
    }
  };

  const handleDoc = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const acceptedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain', 
      'application/vnd.ms-powerpoint', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!acceptedTypes.includes(file.type)) {
      alert('Please select a valid document file (PDF, DOC, DOCX, PPT, TXT, XLS or XLSX)');
      return;
    }

    setDocFile(file);
    setPreviewDoc(file.name);
  };

  const handleSend = async () => {
    if (text === "" && !img.file && !docFile) return;

    let imgUrl = null;
    let docUrl = null;
    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      if (docFile) {
        docUrl = await upload(docFile);
      }

      const messageData = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        createdAt: new Date(),
        text: text || null,
        img: imgUrl || null,
        doc: docUrl || null,
        docName: docFile?.name || null
      };

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(messageData),
      });
      
      await updateLastMessage(chatId, [messageData]);
    } catch (err) {
      console.error("Error sending message:", err);
    }
    setText("");
    setImg({ file: null, url: "" });
    setDocFile(null);
    setPreviewDoc(null);
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleImageClick = (imgUrl) => {
    setPreviewImg(imgUrl);
  };

  const handleClosePreview = () => {
    setPreviewImg(null);
  };

  const formatLastSeen = (date) => {
    if (isCurrentUserBlocked) {
      return "Last seen: ";
    }
    if (isReceiverBlocked) {
      return "Last seen: ";
    }

    if (!date) return "Last seen: Unknown";
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `Last seen ${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `Last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `Last seen ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return "Online";
    }
  };

  const handleDeleteClick = (messageId, event) => {
    event.stopPropagation();
    setDeleteOptions(prevState => prevState === messageId ? null : messageId);
  };

  const handleDeleteForMe = async (messageId) => {
    try {
      const chatDocRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatDocRef);
      if (chatDoc.exists()) {
        const updatedMessages = chatDoc.data().messages.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                deletedFor: msg.deletedFor 
                  ? [...msg.deletedFor, currentUser.id]
                  : [currentUser.id] 
              } 
            : msg
        );
        await updateDoc(chatDocRef, { messages: updatedMessages });
        
        await updateLastMessage(chatId, updatedMessages);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
    setDeleteOptions(null);
  };

  const handleDeleteForEveryone = async (messageId) => {
    try {
      const chatDocRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatDocRef);
      if (chatDoc.exists()) {
        const updatedMessages = chatDoc.data().messages.filter(msg => msg.id !== messageId);
        await updateDoc(chatDocRef, { messages: updatedMessages });
        
        await updateLastMessage(chatId, updatedMessages);
      }
    } catch (error) {
      console.error("Error deleting message for everyone:", error);
    }
    setDeleteOptions(null);
  };

  const updateLastMessage = async (chatId, messages) => {
    const lastMessage = messages.filter(msg => !msg.deletedFor?.includes(currentUser.id)).pop();
    const userChatsRef = doc(db, "userchats", currentUser.id);
    const userChatsDoc = await getDoc(userChatsRef);
    if (userChatsDoc.exists()) {
      const userChats = userChatsDoc.data().chats;
      const updatedChats = userChats.map(chat => 
        chat.chatId === chatId ? { ...chat, lastMessage } : chat
      );
      await updateDoc(userChatsRef, { chats: updatedChats });
    }
  };

  return (
    <div className={`Chat ${theme}`}>
      <div className="chat">
        <div className="top">
          <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
            <div className="texts">
              <span>{user?.username}</span>
              <p>{formatLastSeen(lastSeen)}</p>
            </div>
          </div>
        </div>
        <div className="center">
          {chat?.messages?.map((message) => (
            !message.deletedFor?.includes(currentUser.id) && (
              <div
                className={`message ${message.senderId === currentUser.id ? "own" : ""}`}
                key={message.id}
                ref={el => messagesRef.current[message.createdAt.toDate().getTime()] = el}
              >
                <div className="texts">
                  {message.img && <img src={message.img} alt="" onClick={() => handleImageClick(message.img)} />}
                  {message.text && <p>{message.text}</p>}
                  {message.doc && <p><a href={message.doc} target="_blank" rel="noopener noreferrer">{message.docName}</a></p>}
                  <span>{formatMessageTime(message.createdAt)}</span>
                </div>
                
                <span 
                  className={`delete-icon ${deleteOptions === message.id ? 'active' : ''}`} 
                  onClick={(e) => handleDeleteClick(message.id, e)}
                >
                  🗑️
                </span>
                
                {deleteOptions === message.id && (
                  <div className="delete-options">
                    <button onClick={() => handleDeleteForMe(message.id)}>Delete for me</button>
                    {message.senderId === currentUser.id && (
                      <button onClick={() => handleDeleteForEveryone(message.id)}>Delete for everyone</button>
                    )}
                  </div>
                )}
              </div>
            )
          ))}
          {img.url && (
            <div className="message own">
              <div className="texts">
                <img src={img.url} alt="" onClick={() => handleImageClick(img.url)} />
              </div>
            </div>
          )}
          {previewDoc && (
            <div className="message own">
              <div className="texts">
                <p>{previewDoc}</p>
              </div>
            </div>
          )}
          <div ref={endRef}></div>
        </div>
        <div className="bottom">
          <div className="icons">
            <label htmlFor="file">
              <img src="./img.png" alt="" />
            </label>
            <input type="file" id="file" style={{ display: "none" }} onChange={handleImg} />
          </div>
          <div className="icons">
            <label htmlFor="docFile">
              <img src="./document.png" alt="" />
            </label>
            <input type="file" id="docFile" style={{ display: "none" }} onChange={handleDoc} />
          </div>
          <input
            type="text"
            placeholder={(isCurrentUserBlocked || isReceiverBlocked) ? "You can't send a message" : "Type a message..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isCurrentUserBlocked || isReceiverBlocked}
          />
          <div className="emoji">
            <img src="./emoji.png" alt="" onClick={() => setOpen((prev) => !prev)} />
            <div className="picker">
              <EmojiPicker open={open} onEmojiClick={handleEmoji} />
            </div>
          </div>
          <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
        </div>
        {previewImg && (
          <div className="image-preview">
            <div className="overlay" onClick={handleClosePreview}></div>
            <div className="preview-content">
              <span className="close" onClick={handleClosePreview}>&times;</span>
              <img src={previewImg} alt="Preview" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
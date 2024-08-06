import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { useUserStore } from "../../../../lib/userStore";
import { useState } from "react";

const AddUser = () => {
  const [user, setUser] = useState(null);
  const [searchError, setSearchError] = useState("");
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    if (username === currentUser.username) {
      setSearchError("You cannot add yourself");
      setUser(null);
      return;
    }

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);
      if (!querySnapShot.empty) {
        const foundUser = querySnapShot.docs[0].data();
        if (foundUser.id === currentUser.id) {
          setSearchError("You cannot add yourself");
          setUser(null);
        } else {
          // Check if chat already exists
          const chatExists = await checkIfChatExists(foundUser.id);
          if (chatExists) {
            setSearchError("You already have a chat with this user");
            setUser(null);
          } else {
            setUser(foundUser);
            setSearchError("");
          }
        }
      } else {
        setUser(null);
        setSearchError("No user found");
      }
    } catch (err) {
      console.log(err);
      setSearchError("Error occurred while searching");
    }
  };

  const checkIfChatExists = async (userId) => {
    const userChatsRef = doc(db, "userchats", currentUser.id);
    const userChatsSnap = await getDoc(userChatsRef);
    
    if (userChatsSnap.exists()) {
      const userChats = userChatsSnap.data().chats || [];
      return userChats.some(chat => chat.receiverId === userId);
    }
    return false;
  };

  const handleAdd = async () => {
    if (!user) return;
    if (user.id === currentUser.id) {
      setSearchError("You cannot add yourself");
      return;
    }

    // Double-check if chat already exists
    const chatExists = await checkIfChatExists(user.id);
    if (chatExists) {
      setSearchError("You already have a chat with this user");
      return;
    }

    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");
    try {
      const newChatRef = doc(chatRef);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });
      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });

      setUser(null);
      setSearchError("");
    } catch (err) {
      console.log(err);
      setSearchError("Error occurred while adding user");
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button type="submit">Search</button>
      </form>
      {searchError && <p className="error">{searchError}</p>}
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
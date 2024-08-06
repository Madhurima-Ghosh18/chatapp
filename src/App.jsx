// Modify App.js
import { useEffect, useState } from "react";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { isChatSelected } = useChatStore();
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await updateDoc(doc(db, "users", user.uid), {
            lastSeen: serverTimestamp()
          });
          setJustLoggedIn(true);
        } catch (error) {
          console.error("Error updating last seen:", error);
        }
      } else {
        if (currentUser) {
          try {
            await updateDoc(doc(db, "users", currentUser.id), {
              lastSeen: serverTimestamp()
            });
          } catch (error) {
            console.error("Error updating last seen on logout:", error);
          }
        }
      }
      fetchUserInfo(user?.uid);
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo, currentUser]);

  if (isLoading) return <h2 className="loading">Loading...</h2>;

  return (
    <div className="container">
      {currentUser ? (
        <>
          <List />
          {isChatSelected && <Chat />}
          {isChatSelected && <Detail />}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;
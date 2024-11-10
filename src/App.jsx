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
import { ThemeProvider } from "./ThemeContext";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { isChatSelected } = useChatStore();
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    const unSub = onAuthStateChanged(auth, async (user) => {
      try {
        // Handle sign in
        if (user?.uid) {
          const userDocRef = doc(db, "users", user.uid);
          try {
            await updateDoc(userDocRef, {
              lastSeen: serverTimestamp()
            });
            if (isSubscribed) {
              setJustLoggedIn(true);
            }
          } catch (error) {
            // Only log error if it's not a "document not found" error
            if (error.code !== 'not-found') {
              console.error("Error updating last seen:", error);
            }
          }
        } 
        // Handle sign out
        else if (currentUser?.id) {
          try {
            const userDocRef = doc(db, "users", currentUser.id);
            await updateDoc(userDocRef, {
              lastSeen: serverTimestamp()
            });
          } catch (error) {
            // Only log error if it's not a "document not found" error
            if (error.code !== 'not-found') {
              console.error("Error updating last seen on logout:", error);
            }
          }
        }

        // Always fetch user info, even if updates fail
        if (isSubscribed) {
          await fetchUserInfo(user?.uid);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
      }
    });

    return () => {
      isSubscribed = false;
      unSub();
    };
  }, [fetchUserInfo, currentUser?.id]); // Only depend on currentUser.id, not the whole object

  if (isLoading) {
    return (
      <div className="loading-container">
        <h2 className="loading">Loading...</h2>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className={`container ${currentUser ? 'app-layout' : 'login-layout'}`}>
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
    </ThemeProvider>
  );
};

export default App;
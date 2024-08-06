import React, { useState, useEffect } from "react";
import "./userInfo.css";
import { useUserStore } from "../../../lib/userStore";
import { auth } from "../../../lib/firebase";

const UserInfo = () => {
  const { currentUser } = useUserStore();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light-theme');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme;
  }, [theme]);


  useEffect(() => {
    document.body.className = theme === "light" ? "light-theme" : "dark-theme";
  }, [theme]);

  if (!currentUser) {
    return <div className="userInfo">Loading user information...</div>;
  }

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <div className="userInfo">
      <div className="user">
        <img 
          src={currentUser.avatar || "./avatar.png"} 
          alt={`${currentUser.username}'s avatar`} 
        />
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icons">
        <button onClick={() => auth.signOut()}>
          <img src="./logout.png" alt="Logout" />
        </button>
        <button onClick={toggleTheme}>
          <img src={theme === "light" ? "./moon.png" : "./sun.png"} alt="Toggle Theme" />
        </button>
      </div>
    </div>
  );
};

export default UserInfo;

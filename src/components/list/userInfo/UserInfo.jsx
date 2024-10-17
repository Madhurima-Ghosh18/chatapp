import React, { useState, useEffect } from "react";
import '../../../theme.css';
import "./userInfo.css";
import { useUserStore } from "../../../lib/userStore";
import { auth } from "../../../lib/firebase";
import ProfileModal from "./ProfileModal/ProfileModal";
import { useTheme } from "../../../ThemeContext";

const UserInfo = () => {
  const { currentUser, updateUser, fetchUserInfo } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      fetchUserInfo(uid);
    }
  }, [fetchUserInfo]);

  

  if (!currentUser) {
    return <div className="userInfo">Loading user information...</div>;
  }

  
  const toggleDropdown = () => {
    setShowDropdown(prevState => !prevState);
  };

  const handleEditProfile = () => {
    setModalOpen(true);
    setError(null); // Clear any previous errors
  };

  const handleLogout = () => {
    auth.signOut();
  };

  const closeModal = () => {
    setModalOpen(false);
    setError(null); // Clear any errors when closing the modal
  };

  const handleSave = async (updatedUser) => {
    try {
      console.log("Saving updated user data:", updatedUser);
      await updateUser(updatedUser);
      const uid = auth.currentUser?.uid;
      if (uid) {
        await fetchUserInfo(uid); // Re-fetch the updated user data
      }
      closeModal();
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className={`UserInfo ${theme}`}>
      <div className="userinfo">
      <div className="user">
        <img
          src={currentUser.avatar || "./avatar.png"}
          alt={`${currentUser.username}'s avatar`}
        />
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icons">
        <button className="info-icon" onClick={toggleDropdown}>
          <img src="./info.png" alt="Info" />
        </button>
        {showDropdown && (
          <div className="dropdown-menu">
            <div className="dropdown-icon" onClick={handleEditProfile}>
              <img src="./edit.png" alt="" />
            <button>Edit Profile</button>
            </div>
            <div className="dropdown-icon" onClick={handleLogout}>
              <img src="./logout.png" alt="" />
            <button>Logout</button>
          </div>
          </div>
        )}
        <button onClick={toggleTheme}>
          <img src={theme === "light-theme" ? "./moon.png" : "./sun.png"} alt="Toggle Theme" />
        </button>
      </div>
      {isModalOpen && (
        <ProfileModal
          user={currentUser}
          onClose={closeModal}
          onSave={handleSave}
          error={error}
        />
      )}
    </div>
    </div>
  );
};

export default UserInfo;

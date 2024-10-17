import React, { useState, useRef } from "react";
import "../../../../theme.css";
import "./ProfileModal.css";
import { useTheme } from "../../../../ThemeContext";

const ProfileModal = ({ user, onClose, onSave }) => {
  const [avatar, setAvatar] = useState(user.avatar);
  const fileInputRef = useRef(null);
  const { theme } = useTheme();
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ avatar });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={`ProfileModal ${theme}`}>
    <div className="profile-modal">
      <div className="modal-content">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="avatar-container" onClick={handleAvatarClick}>
            <img
              src={avatar || "./avatar.png"}
              alt="User Avatar"
              className="preview-image"
            />
            <div className="avatar-overlay">Click to change</div>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          <div className="button-group">
            <button type="submit" className="save">Save</button>
            <button type="button" onClick={onClose} className="cancel">Cancel</button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default ProfileModal;

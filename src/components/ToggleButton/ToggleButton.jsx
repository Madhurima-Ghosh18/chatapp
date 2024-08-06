// src/components/ToggleButton.jsx
import React, { useState } from 'react';
import moonIcon from '../assets/moon.png';
import sunIcon from '../assets/sun.png';
import './togglebutton.css';

const ToggleButton = () => {
  const [isLightTheme, setIsLightTheme] = useState(true);

  const toggleTheme = () => {
    setIsLightTheme(!isLightTheme);
    document.body.classList.toggle('light-theme', isLightTheme);
    document.body.classList.toggle('dark-theme', !isLightTheme);
  };

  return (
    <div className="toggle-button" onClick={toggleTheme}>
      <img src={isLightTheme ? moonIcon : sunIcon} alt="Toggle Theme" />
    </div>
  );
};

export default ToggleButton;

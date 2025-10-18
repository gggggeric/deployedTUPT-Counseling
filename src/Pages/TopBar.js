import React, { useState, useEffect } from 'react';
import './TopBar.css';

// Import your logo
import tupLogo from '../assets/tup-logo.png';

const TopBar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width <= 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getDisplayText = () => {
    if (windowWidth <= 360) {
      return "TUP Counseling";
    } else if (windowWidth <= 480) {
      return "TUP Taguig Counseling";
    } else if (windowWidth <= 768) {
      return "TUP Taguig Counseling Scheduler";
    } else {
      return "Technological University of the Philippines - Taguig Counseling Scheduler";
    }
  };

  return (
    <nav className="top-bar">
      <div className="top-bar-content">
        {/* Logo/Brand - Absolute left aligned */}
        <div className="brand">
          <img 
            src={tupLogo} 
            alt="TUP Logo" 
            className="logo"
          />
          <h1 className="brand-text">{getDisplayText()}</h1>
        </div>
      </div>
    </nav>
  );
};

export default TopBar;
import React from 'react';
import './TopBar.css';

// Import your logo
import tupLogo from '../assets/tup-logo.png';

const TopBar = () => {
  return (
    <nav className="top-bar">
      <div className="top-bar-content">
        {/* Logo/Brand - Absolute left aligned */}
        <div className="brand">
          <img src={tupLogo} alt="TUP Logo" />
          <h1>Technological University of the Philippines - Taguig Counseling Scheduler</h1>
        </div>
      </div>
    </nav>
  );
};

export default TopBar;
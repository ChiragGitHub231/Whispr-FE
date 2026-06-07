import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, LogIn, UserPlus } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <MessageSquare className="brand-icon" />
          <span className="brand-name">Whispr</span>
        </Link>
        
        <div className="nav-links">
          <Link to="/" className={`nav-item ${isActive('/')}`}>
            Home
          </Link>
          <Link to="/login" className={`nav-item ${isActive('/login')}`}>
            <LogIn size={18} />
            <span>Login</span>
          </Link>
          <Link to="/register" className={`nav-item button-nav ${isActive('/register')}`}>
            <UserPlus size={18} />
            <span>Sign Up</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

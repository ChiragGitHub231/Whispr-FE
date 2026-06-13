import React from 'react';
import { Outlet } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="split-container">
      {/* Shared Left 60% Banner Section - Renders ONLY ONCE */}
      <div className="split-banner">
        <div className="banner-content">
          <div className="banner-brand animate-fade-in">
            <MessageSquare className="brand-icon" size={32} />
            <span>Whispr</span>
          </div>
          
          <div className="banner-text-group">
            <h1 className="banner-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Connect instantly, <span className="gradient-text">Chat securely.</span>
            </h1>
            
            <div className="banner-purpose-text animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <p className="banner-desc-main">
                Whispr is a lightweight, secure messaging platform designed for speed and simplicity.
              </p>
              <p className="banner-desc-sub">
                Sign up today to create rooms and chat with your friends or colleagues.
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Background Orbs */}
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
      </div>

      {/* Right 40% Dynamic Form Section */}
      <div className="split-form-container">
        <Outlet />
      </div>
    </div>
  );
};

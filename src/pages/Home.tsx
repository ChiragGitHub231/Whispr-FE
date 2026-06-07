import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Sparkles, ArrowRight, MessageCircle } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={16} className="badge-icon animate-pulse" />
          <span>Realtime communication reimagined</span>
        </div>
        <h1 className="hero-title animate-fade-in">
          Connect instantly with <span className="gradient-text">Whispr</span>
        </h1>
        <p className="hero-subtitle">
          Experience ultra-fast, secure, and modern messaging. Built for humans, designed for performance.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-large">
            Get Started
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-large">
            Log In
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2 className="section-title">Why choose Whispr?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper purple">
              <Zap size={24} />
            </div>
            <h3>Lightning Fast</h3>
            <p>Real-time delivery system powered by modern WebSockets and optimized backends.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper blue">
              <Shield size={24} />
            </div>
            <h3>End-to-End Secure</h3>
            <p>Your privacy is our priority. Feel safe talking about what matters with fully encrypted logs.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper green">
              <MessageCircle size={24} />
            </div>
            <h3>Intelligent UI</h3>
            <p>A polished user experience featuring fluid animations, dark modes, and rich layouts.</p>
          </div>
        </div>
      </section>

      {/* Decorative Blur Backgrounds */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
    </div>
  );
};

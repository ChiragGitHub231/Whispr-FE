import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PublicRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Restoring session...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
};

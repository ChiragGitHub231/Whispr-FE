import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  contact_no?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore user session on startup
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Failed to restore user session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed. Please try again.');
    }

    if (data.user) {
      setUser(data.user);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    // 1. Call Backend Register
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed. Please try again.');
    }

    // 2. Clear auto-login cookie set by the backend
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (logoutError) {
      console.warn('Failed to clear session after registration:', logoutError);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

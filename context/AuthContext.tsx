import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'admin' | 'player' | 'auctioneer';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  sport?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, role: UserRole) => void;
  logout: () => void;
  setSport: (sport: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string, role: UserRole) => {
    // Simple auth simulation
    const newUser: User = {
      id: Math.random().toString(),
      username,
      role,
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const setSport = (sport: string) => {
    if (user) {
      setUser({ ...user, sport });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setSport }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

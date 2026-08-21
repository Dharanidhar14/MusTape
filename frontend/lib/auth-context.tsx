"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { apiBaseUrl } from "@/lib/config";
import { checkAuth, loginWithGoogle, logout } from "@/lib/mustape";

export type User = {
  id: string;
  name: string;
  email: string;
  picture: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (credential: string) => Promise<void>;
  logoutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, clientId }: { children: React.ReactNode; clientId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const currentUser = await checkAuth();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (credential: string) => {
    const loggedInUser = await loginWithGoogle(credential);
    setUser(loggedInUser);
  };

  const logoutUser = async () => {
    await logout();
    setUser(null);
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthContext.Provider value={{ user, loading, login, logoutUser }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

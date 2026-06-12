import { createContext, useContext, useMemo, useState } from "react";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredEmail,
  getStoredRole,
  saveSession
} from "./tokenStorage";
import type { LoginResponse, UserRole } from "../types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  email: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  signIn: (tokens: LoginResponse, role: UserRole, email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    role: getStoredRole(),
    email: getStoredEmail()
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.accessToken),
      signIn(tokens, role, email) {
        saveSession({ ...tokens, role, email });
        setState({ ...tokens, role, email });
      },
      signOut() {
        clearSession();
        setState({ accessToken: null, refreshToken: null, role: null, email: null });
      }
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

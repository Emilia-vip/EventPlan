import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AUTH_EXPIRED_EVENT } from "../errors";
import { login as loginRequest, me, signup as signupRequest } from "../services/auth";
import type { Session, UserDto } from "../services/auth";
import { clearToken, getToken, setToken } from "../session";
import type { LoginInput, SignupInput } from "../validation";

type AuthState = {
  user: UserDto | null;
  checking: boolean;
  isAdmin: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [checking, setChecking] = useState(() => getToken() !== null);

  // If there is a stored token, ask the server who it belongs to
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        // An expired token is cleared by the http layer; a network error just leaves us logged out
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The server rejected our token: log out in the UI too
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const startSession = useCallback((session: Session) => {
    setToken(session.token);
    setUser(session.user);
  }, []);

  const login = useCallback(async (input: LoginInput) => startSession(await loginRequest(input)), [startSession]);
  const signup = useCallback(async (input: SignupInput) => startSession(await signupRequest(input)), [startSession]);
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, checking, isAdmin: user?.role === "admin", login, signup, logout }),
    [user, checking, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

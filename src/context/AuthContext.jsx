/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import api from "../services/api";
import { STORAGE_KEYS } from "../utils/constants";

const AuthContext = createContext(null);

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);

  const persistSession = (u) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(u));
  };
  const clearSession = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  };

  // Doctor / Admin login (password-based)
  const login = async ({ role, email, password }) => {
    const u = await api.login(role, { email, password });
    persistSession(u);
    return u;
  };

  // Patient – password login
  const patientLogin = async ({ email, password }) => {
    const u = await api.patientLogin({ email, password });
    persistSession(u);
    return u;
  };

  // Patient – OTP login (passwordless)
  const patientOtpLogin = async ({ email, code }) => {
    const u = await api.patientOtpLogin(email, code);
    persistSession(u);
    return u;
  };

  // Patient signup (requires verified OTP)
  const signupPatient = async (payload) => {
    const u = await api.registerPatient(payload);
    persistSession(u);
    return u;
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    login,
    patientLogin,
    patientOtpLogin,
    signupPatient,
    logout: clearSession,
    hasRole: (role) => user?.role === role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

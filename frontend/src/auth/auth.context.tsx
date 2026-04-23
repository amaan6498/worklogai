import { createContext, useContext, useState } from "react";
import api from "@/api/axios";
import type { AuthResponse, User } from "./auth.types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<{ message: string, email: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ message: string }>;
  resendOtp: (email: string) => Promise<{ message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const { data } = await api.post<{ message: string, email: string }>("/auth/signup", {
      name,
      email,
      password,
    });
    return data;
  };

  const verifyOtp = async (email: string, otp: string) => {
    const { data } = await api.post<AuthResponse>("/auth/verify-otp", {
      email,
      otp,
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const forgotPassword = async (email: string) => {
    const { data } = await api.post<{ message: string }>("/auth/forgot-password", { email });
    return data;
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const { data } = await api.post<{ message: string }>("/auth/reset-password", { email, otp, newPassword });
    return data;
  };

  const resendOtp = async (email: string) => {
    const { data } = await api.post<{ message: string }>("/auth/resend-otp", { email });
    return data;
  };


  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, verifyOtp, forgotPassword, resetPassword, resendOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

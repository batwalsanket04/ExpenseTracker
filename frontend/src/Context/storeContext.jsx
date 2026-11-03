import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

/* -------------------------------------------------------------------------- */
/*  API base URL – change this to your deployed backend when going live       */
/* -------------------------------------------------------------------------- */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const AuthContext = createContext(null);

/**
 * Configured axios client:
 *  - attaches Bearer access token from localStorage on every request
 *  - on 401, tries to refresh the access token via the refresh token in Redis
 *  - if refresh fails, logs the user out
 */
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refreshToken")
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken: localStorage.getItem("refreshToken"),
        });
        localStorage.setItem("accessToken", data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        // refresh failed -> force logout
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback((tokens, userData) => {
    setUser(userData);
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    localStorage.setItem("token", tokens.accessToken); // backward compat
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("userId", userData.id);
    localStorage.setItem("userName", userData.name);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.clear();
    window.location.href = "/login";
  }, []);

  const value = {
    user,
    role: user ? user.role : null,
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
    isAuthenticated: !!localStorage.getItem("accessToken"),
    login,
    logout,
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* eslint-disable react-refresh/only-export-components */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;

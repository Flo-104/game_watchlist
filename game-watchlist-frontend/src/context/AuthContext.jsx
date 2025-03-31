import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);

  // Beim Login die Daten speichern
  const login = (userId, isAdmin, username) => {
    setIsLoggedIn(true);
    setIsAdmin(isAdmin);
    setUserId(userId);
    setUsername(username);

    // Speichere die Daten im localStorage
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("isAdmin", isAdmin);
    localStorage.setItem("userId", userId);
    localStorage.setItem("username", username);
  };

  // Beim Logout die Daten entfernen
  const logout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserId(null);
    setUsername(null);

    // Entferne die Daten aus dem localStorage
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
  };

  // Beim Laden der Seite die Daten aus dem localStorage wiederherstellen
  useEffect(() => {
    const storedIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const storedIsAdmin = localStorage.getItem("isAdmin") === "true";
    const storedUserId = localStorage.getItem("userId");
    const storedUsername = localStorage.getItem("username");

    if (storedIsLoggedIn) {
      setIsLoggedIn(true);
      setIsAdmin(storedIsAdmin);
      setUserId(storedUserId);
      setUsername(storedUsername);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, userId, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
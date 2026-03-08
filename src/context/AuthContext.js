import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('tj_user');
    const savedToken = localStorage.getItem('tj_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setAccessToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setAccessToken(token);
    localStorage.setItem('tj_user', JSON.stringify(userData));
    localStorage.setItem('tj_token', token);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('tj_user');
    localStorage.removeItem('tj_token');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
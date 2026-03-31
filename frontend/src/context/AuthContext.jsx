import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem('fp_user') || 'null'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fp_token');
    if (token) {
      authAPI.me()
        .then(r => { setUser(r.data.user); localStorage.setItem('fp_user', JSON.stringify(r.data.user)); })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (username, password) => {
    const r = await authAPI.login({ username, password });
    localStorage.setItem('fp_token', r.data.token);
    localStorage.setItem('fp_user',  JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem('fp_token');
    localStorage.removeItem('fp_user');
    setUser(null);
  };

  const can = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

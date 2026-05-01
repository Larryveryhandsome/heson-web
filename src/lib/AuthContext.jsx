import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getDeviceFingerprint } from '@/lib/deviceFingerprint';
import DeviceBannedScreen from '@/components/DeviceBannedScreen';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({ id: 'heson', public_settings: {} });
  const [deviceBanned, setDeviceBanned] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkDeviceBan = async (userEmail) => {
    try {
      const fingerprint = await getDeviceFingerprint();
      const res = await base44.functions.invoke('checkDevice', {
        fingerprint,
        userEmail: userEmail || '',
        userAgent: navigator.userAgent,
      });
      if (res.data?.banned) {
        setDeviceBanned({ reason: res.data.reason });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const checkAppState = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const token = localStorage.getItem('heson_token');
      if (!token) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        return;
      }

      const currentUser = await base44.auth.me();

      const isDeviceBanned = await checkDeviceBan(currentUser?.email);
      if (isDeviceBanned) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        return;
      }

      if (currentUser?.role === 'banned') {
        setAuthError({ type: 'user_banned', message: '帳號已停用' });
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        return;
      }

      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('heson_token');
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout();
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  if (deviceBanned) {
    return <DeviceBannedScreen reason={deviceBanned.reason} />;
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

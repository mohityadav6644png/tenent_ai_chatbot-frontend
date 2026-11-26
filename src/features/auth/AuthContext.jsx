import { createContext, useEffect, useMemo, useState } from 'react';
import { LayoutUserContext } from '../../shared/hooks/useLayoutUser.js';
import { clearAuthToken, getAuthToken } from '../../api/httpClient.js';
import * as authService from './services/auth.service.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(getAuthToken()));

  useEffect(() => {
    let isMounted = true;
    const token = getAuthToken();
    if (token) {
      authService
        .getCurrentUser()
        .then((fetchedUser) => {
          if (isMounted) {
            setUser(fetchedUser || null);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            clearAuthToken();
            setUser(null);
            setIsLoading(false);
          }
        });
    } else {
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login: async (credentials) => {
        const signedInUser = await authService.login(credentials);
        setUser(signedInUser);
        setIsLoading(false);
        return signedInUser;
      },
      acceptInvite: async (payload) => {
        const activatedUser = await authService.acceptInvite(payload);
        setUser(activatedUser);
        setIsLoading(false);
        return activatedUser;
      },
      logout: async () => {
        try {
          await authService.logout(user);
        } finally {
          setUser(null);
          setIsLoading(false);
        }
      },
    }),
    [user, isLoading],
  );

  return (
    <AuthContext.Provider value={value}>
      <LayoutUserContext.Provider value={value}>{children}</LayoutUserContext.Provider>
    </AuthContext.Provider>
  );
}

export { AuthContext };

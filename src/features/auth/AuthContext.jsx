import { createContext, useEffect, useMemo, useState } from 'react';
import { LayoutUserContext } from '../../shared/hooks/useLayoutUser.js';
import { getAuthToken } from '../../api/httpClient.js';
import * as authService from './services/auth.service.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const token = getAuthToken();
    if (token) {
      authService
        .getCurrentUser()
        .then((fetchedUser) => {
          if (isMounted && fetchedUser) {
            setUser(fetchedUser);
          }
        })
        .catch(() => {
          if (isMounted) {
            setUser(null);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: async (credentials) => {
        const signedInUser = await authService.login(credentials);
        setUser(signedInUser);
        return signedInUser;
      },
      acceptInvite: async (payload) => {
        const activatedUser = await authService.acceptInvite(payload);
        setUser(activatedUser);
        return activatedUser;
      },
      logout: async () => {
        try {
          await authService.logout(user);
        } finally {
          setUser(null);
        }
      },
    }),
    [user],
  );

  return (
    <AuthContext.Provider value={value}>
      <LayoutUserContext.Provider value={value}>{children}</LayoutUserContext.Provider>
    </AuthContext.Provider>
  );
}

export { AuthContext };

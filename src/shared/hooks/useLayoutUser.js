import { createContext, useContext } from 'react';

export const LayoutUserContext = createContext(null);

export function useLayoutUser() {
  const context = useContext(LayoutUserContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

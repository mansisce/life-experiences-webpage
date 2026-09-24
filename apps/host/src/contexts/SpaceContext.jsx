import { createContext } from 'react';

export const SpaceContext = createContext({
  currentSpace: 'personal',
  setCurrentSpace: () => {},
  isAuthenticated: false,
  setIsAuthenticated: () => {},
});

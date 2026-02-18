import { createContext, useContext, type ReactNode } from 'react';
import { useTradieLinkAppLogic } from '../hooks/useTradieLinkAppLogic';

type AppContextValue = ReturnType<typeof useTradieLinkAppLogic>;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const value = useTradieLinkAppLogic();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeId, ThemeConfig, THEMES } from '../types/theme';

interface ThemeContextType {
  currentTheme: ThemeId;
  themeConfig: ThemeConfig;
  setTheme: (themeId: ThemeId) => void;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'aurahifi_active_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && saved in THEMES) {
      return saved as ThemeId;
    }
    return 'retro-amber';
  });

  const themeConfig = THEMES[currentTheme] || THEMES['retro-amber'];

  const setTheme = (themeId: ThemeId) => {
    if (themeId in THEMES) {
      setCurrentThemeState(themeId);
      localStorage.setItem(LOCAL_STORAGE_KEY, themeId);
    }
  };

  // Synchronize CSS variables on the root document
  useEffect(() => {
    const root = document.documentElement;
    const vars = themeConfig.cssVariables;

    Object.entries(vars).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });

    // Set dataset attribute for potential CSS targeting
    root.setAttribute('data-theme', themeConfig.id);
  }, [themeConfig]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeConfig,
        setTheme,
        availableThemes: Object.values(THEMES),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

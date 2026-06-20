import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme as nativewindColorScheme, useColorScheme as useNativewindColorScheme } from 'nativewind';

const THEME_STORAGE_KEY = 'theme_preference';

type Scheme = 'light' | 'dark';

type ThemeContextValue = {
  isDark: boolean;
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export async function loadStoredTheme(): Promise<Scheme> {
  try {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export async function persistTheme(scheme: Scheme): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
  } catch {
    // Persistence failure should not block in-memory theme switching.
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme } = useNativewindColorScheme();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadStoredTheme().then((scheme) => {
      if (isMounted) {
        nativewindColorScheme.set(scheme);
        setHydrated(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!hydrated) {
    return null;
  }

  const toggleDark = () => {
    const next: Scheme = colorScheme === 'dark' ? 'light' : 'dark';
    nativewindColorScheme.set(next);
    persistTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ isDark: colorScheme === 'dark', toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

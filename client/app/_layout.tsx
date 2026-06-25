import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import store from '@/redux/store/store';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { BudgetsProvider } from '@/contexts/BudgetsContext';
import { SavingsGoalProvider } from '@/contexts/SavingsGoalContext';

import "./global.css";

SplashScreen.preventAutoHideAsync();

function NavigationThemeBridge({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <NavigationThemeBridge>
        <Provider store={store}>
          <BudgetsProvider>
            <SavingsGoalProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </SavingsGoalProvider>
          </BudgetsProvider>
        </Provider>
        <StatusBar style="auto" />
      </NavigationThemeBridge>
    </ThemeProvider>
  );
}

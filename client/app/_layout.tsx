import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import Toast, { BaseToast } from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/useColorScheme';

import store from '@/redux/store/store';

import "./global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: '#22c55e', // green
          marginTop: 60,
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
        }}
        text1Style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#000',
        }}
        text2Style={{
          fontSize: 16,
          color: '#555',
        }}
      />
    ),
    error: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: '#ef4444',
          borderLeftWidth: 10,
          marginTop: 50,
        }}
        text1Style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#000',
        }}
        text2Style={{
          fontSize: 16,
          color: '#555',
        }}
      />
    )
  };

  if (!loaded) {
    return <ActivityIndicator color='red' />; // still loading
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Provider store={store}>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast config={toastConfig} />
      </Provider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
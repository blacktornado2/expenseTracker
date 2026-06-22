import React from 'react';
import { ViewStyle } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, AlignJustify, PieChart, BarChart2, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SHADOW_TAB, SHADOW_TAB_DARK } from '@/constants/shadows';
import Fab from '@/components/Fab';

const TAB_ACCENTS = {
  home: '#0FB46B',
  activity: '#2BB3FF',
  budgets: '#7C5CFC',
  insights: '#F59E0B',
  settings: '#F5A623',
};

const INACTIVE_LIGHT = '#B4B9B0';
const INACTIVE_DARK = '#607060';

// '#FFFFFF' = bg-card, '#192218' = bg-card-dark (tailwind.config.js).
export function getTabBarStyle(isDark: boolean): ViewStyle {
  return {
    backgroundColor: isDark ? '#192218' : '#FFFFFF',
    borderTopColor: isDark ? '#252E23' : '#F3F2EB', // border-row(-dark)
    ...(isDark ? SHADOW_TAB_DARK : SHADOW_TAB),
  };
}

export default function TabLayout() {
  const { isDark } = useTheme();
  const inactiveColor = isDark ? INACTIVE_DARK : INACTIVE_LIGHT;

  return (
    <>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: getTabBarStyle(isDark) }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarActiveTintColor: TAB_ACCENTS.home,
            tabBarInactiveTintColor: inactiveColor,
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Activity',
            tabBarActiveTintColor: TAB_ACCENTS.activity,
            tabBarInactiveTintColor: inactiveColor,
            tabBarIcon: ({ color, size }) => <AlignJustify color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: 'Budgets',
            tabBarActiveTintColor: TAB_ACCENTS.budgets,
            tabBarInactiveTintColor: inactiveColor,
            tabBarIcon: ({ color, size }) => <PieChart color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            tabBarActiveTintColor: TAB_ACCENTS.insights,
            tabBarInactiveTintColor: inactiveColor,
            tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Settings',
            tabBarActiveTintColor: TAB_ACCENTS.settings,
            tabBarInactiveTintColor: inactiveColor,
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          }}
        />
      </Tabs>
      <Fab />
    </>
  );
}

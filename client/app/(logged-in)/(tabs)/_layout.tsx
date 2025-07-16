import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Tabs } from 'expo-router';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

function AnimatedTabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <MaterialIcons name={name} size={24} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4287F5',
        headerShown: false,
        tabBarStyle: {
          height: 75,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="home" focused={focused} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="payments" focused={focused} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="person" focused={focused} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
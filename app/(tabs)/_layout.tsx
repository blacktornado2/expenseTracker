import React from 'react';
import { Tabs } from 'expo-router';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'red',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <MaterialIcons name="dashboard" size={24} color="grey" />
        }}
      />
       <Tabs.Screen
        name="login"
        options={{
          title: 'Login',
          tabBarIcon: () => <MaterialIcons name="login" size={24} color="grey" />
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: () => <MaterialIcons name="payments" size={24} color="gray" />
        }}
      />
    </Tabs>
  );
}
